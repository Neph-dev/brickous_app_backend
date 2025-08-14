import { Request, Response } from 'express';
import { ErrorResponse } from '../../../constants';
import { AppError, generateCode, logger } from '../../../shared/utils';
import { MongooseUserRepo } from '../../user/infra';
import { MongoosePasswordResetRepo } from '../infra/PasswordResetRepo';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { hashPassword, PASSWORD_MIN_LENGTH } from '../../user/utils';
import { emailValidation } from '../../../shared/utils/validations';
import { codeVerificationTemplate } from '../../../shared/utils/emails/confirmationCodeTemplate';

const CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;

const { EMAIL_SEND_ERROR, GENERIC } = ErrorResponse;

export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const isEmailValid = emailValidation(email || '');

        if (!isEmailValid) {
            return res.status(200).json({
                status: 200,
                message: 'If the email exists, a code has been sent'
            });
        }

        const userRepo = new MongooseUserRepo();
        const user = await userRepo.getByEmail(email);

        if (!user) {
            logger.info('Password reset requested for non-existing email');
            return res.status(200).json({
                status: 200,
                message: 'If the email exists, a code has been sent'
            });
        }

        const resetRepo = new MongoosePasswordResetRepo();

        const existingReset = await resetRepo.getLatestActiveByEmail(email);
        if (existingReset) {
            await resetRepo.markUsed(existingReset.resetId);
        }

        const code = generateCode(6);
        const codeHash = await bcrypt.hash(code, 12);
        const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

        await resetRepo.create({
            resetId: uuidv4(),
            email: user.email,
            codeHash,
            expiresAt,
            attempts: 1,
            maxAttempts: MAX_ATTEMPTS,
            used: false
        });

        try {
            const sendEmail = await codeVerificationTemplate(code, user.email, expiresAt);

            if (sendEmail !== 200) {
                logger.error('Failed to send confirmation email');
                throw new AppError(EMAIL_SEND_ERROR.message, EMAIL_SEND_ERROR.code, EMAIL_SEND_ERROR.statusCode);
            }
        } catch (emailErr) {
            logger.error('Failed sending password reset email', { error: emailErr instanceof Error ? emailErr.message : emailErr });
            throw new AppError(EMAIL_SEND_ERROR.message, EMAIL_SEND_ERROR.code, EMAIL_SEND_ERROR.statusCode);
        }

        return res.status(200).json({ status: 200, message: 'If the email exists, a code has been sent' });
    } catch (error) {
        logger.error('Error requesting password reset:', error);
        if (error instanceof AppError) return res.status(error.statusCode).json(error);
        return res.status(GENERIC.statusCode).json(GENERIC);
    }
};

export const resendPasswordResetCode = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ status: 400, code: 'MISSING_EMAIL', message: 'Email is required' });
    }

    const resetRepo = new MongoosePasswordResetRepo();
    const entry = await resetRepo.getLatestActiveByEmail(email);

    if (!entry) {
        return res.status(404).json({ status: 404, code: 'NOT_FOUND', message: 'No password reset request found' });
    }

    if (entry.attempts >= entry.maxAttempts) {
        return res.status(429).json({ status: 429, code: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts. Request a new code.' });
    }

    await resetRepo.incrementAttempts(entry.resetId);

    const code = generateCode(6);
    const codeHash = await bcrypt.hash(code, 12);
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

    await resetRepo.updateCode(entry.resetId, codeHash, expiresAt);

    try {
        const sendEmail = await codeVerificationTemplate(code, email, expiresAt);

        if (sendEmail !== 200) {
            logger.error('Failed to send confirmation email');
            throw new AppError(EMAIL_SEND_ERROR.message, EMAIL_SEND_ERROR.code, EMAIL_SEND_ERROR.statusCode);
        }
    } catch (emailErr) {
        logger.error('Failed sending password reset email', { error: emailErr instanceof Error ? emailErr.message : emailErr });
        throw new AppError(EMAIL_SEND_ERROR.message, EMAIL_SEND_ERROR.code, EMAIL_SEND_ERROR.statusCode);
    }

    return res.status(200).json({ status: 200, message: 'If the email exists, a code has been sent' });
};

export const verifyPasswordResetCode = async (req: Request, res: Response) => {
    try {
        const { email, code, resetId } = req.body;
        if (!email || !code || !resetId) {
            return res.status(400).json({ status: 400, code: 'MISSING_FIELDS', message: 'Email, code and resetId are required' });
        }

        const resetRepo = new MongoosePasswordResetRepo();
        const entry = await resetRepo.getByResetId(resetId);
        // Generic response to avoid enumeration
        if (!entry || entry.used || entry.email !== email) {
            return res.status(400).json({ status: 400, code: 'INVALID_CODE', message: 'Invalid or expired code' });
        }

        if (new Date(entry.expiresAt) < new Date()) {
            return res.status(400).json({ status: 400, code: 'CODE_EXPIRED', message: 'Invalid or expired code' });
        }

        if (entry.attempts >= entry.maxAttempts) {
            return res.status(429).json({ status: 429, code: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts. Request a new code.' });
        }

        // Increment attempts first to prevent brute force
        const updated = await resetRepo.incrementAttempts(resetId);
        if (!updated) {
            return res.status(400).json({ status: 400, code: 'INVALID_CODE', message: 'Invalid or expired code' });
        }

        const isMatch = await bcrypt.compare(code, updated.codeHash);
        if (!isMatch) {
            return res.status(400).json({ status: 400, code: 'INVALID_CODE', message: 'Invalid or expired code' });
        }

        // Mark used to avoid reuse during verification step (we’ll create a new one-time ticket or proceed immediately)
        await resetRepo.markUsed(resetId);

        return res.status(200).json({ status: 200, message: 'Code verified' });
    } catch (error) {
        logger.error('Error verifying password reset code:', error);
        return res.status(ErrorResponse.GENERIC.statusCode).json(ErrorResponse.GENERIC);
    }
};

export const completePasswordReset = async (req: Request, res: Response) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ status: 400, code: 'MISSING_FIELDS', message: 'Email and newPassword are required' });
        }

        // Enforce strong password policy (reuse existing util if available)
        // Fallback: minimum 8 chars
        if (typeof newPassword !== 'string' || newPassword.length < PASSWORD_MIN_LENGTH) {
            return res.status(400).json({ status: 400, code: 'WEAK_PASSWORD', message: 'Password does not meet requirements' });
        }

        const userRepo = new MongooseUserRepo();
        const user = await userRepo.getByEmail(email);
        if (!user || !user._id) {
            return res.status(400).json({ status: 400, code: 'INVALID_REQUEST', message: 'Invalid request' });
        }

        const hash = await hashPassword(newPassword);
        await userRepo.update(user._id, { password: hash, isConfirmed: true });

        return res.status(200).json({ status: 200, message: 'Password has been reset successfully' });
    } catch (error) {
        logger.error('Error completing password reset:', error);
        return res.status(ErrorResponse.GENERIC.statusCode).json(ErrorResponse.GENERIC);
    }
};
