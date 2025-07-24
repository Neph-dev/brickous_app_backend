import { Request, Response } from 'express';
import { ErrorResponse } from '../../../constants';
import { AppError, logger } from '../../../shared/utils';
import { MongooseUserRepo } from '../../user/infra';
import { MongooseSessionRepo } from '../infra/SessionRepo';
import { AccountStatus } from '../../user/types';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * Controller handling user sign-in functionality
 * 
 * This controller authenticates users by validating their email and password,
 * generates JWT access and refresh tokens, manages user sessions, and returns
 * user information upon successful authentication.
 * 
 * @param req - Express Request object containing:
 *   - body.email - User's email address
 *   - body.password - User's password
 *   - body.deviceId - Optional unique device identifier (generates UUID if not provided)
 * 
 * @param res - Express Response object used to send authentication results
 * 
 * @returns A JSON response with:
 *   - On success (200): User details and authentication tokens in headers
 *   - On error (400/401/500): Appropriate error message and status code
 * 
 * @throws AppError - Custom application errors with specific status codes
 * 
 * @remarks
 * The controller performs the following operations:
 * - Validates required credentials
 * - Verifies user exists and account is active
 * - Checks password validity
 * - Generates access and refresh tokens
 * - Manages user sessions (removes existing sessions for the same device)
 * - Sets authentication tokens in response headers
 * - Logs authentication activities for security monitoring
 */
export const signinController = async (req: Request, res: Response) => {
    const { GENERIC, NOT_FOUND, UNAUTHORIZED } = ErrorResponse;

    try {
        const { email, password, deviceId = uuidv4() } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 400,
                message: 'Email and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        const userRepo = new MongooseUserRepo();
        const user = await userRepo.getByEmail(email);

        if (!user) {
            logger.info(`Login attempt for non-existent user: ${email}`);
            return res.status(401).json({
                status: 401,
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        if (user.status !== AccountStatus.Active) {
            logger.info(`Login attempt for inactive user: ${email}`);
            return res.status(401).json({
                status: 401,
                message: 'Account is not active',
                code: 'INACTIVE_ACCOUNT'
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            logger.info(`Invalid password attempt for user: ${email}`);
            return res.status(401).json({
                status: 401,
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        const JWT_SECRET = process.env.JWT_SECRET || '';
        const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || JWT_SECRET;
        const accessTokenExpiresIn = 60 * 60; // 1 hour
        const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7 days

        const payload = {
            sub: user._id,
            exp: Math.floor(Date.now() / 1000) + accessTokenExpiresIn,
            userType: user.role,
            accountType: user.accountType,
            email: user.email
        };

        const accessToken = jwt.sign(payload, JWT_SECRET);
        const refreshToken = jwt.sign({ sub: user._id }, REFRESH_JWT_SECRET, { expiresIn: refreshTokenExpiresIn });

        const sessionRepo = new MongooseSessionRepo();
        const existingSession = await sessionRepo.getSessionByUserIdAndDevice(user._id as string, deviceId);

        if (existingSession) {
            await sessionRepo.deleteSession(existingSession.sessionId);
        }

        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setSeconds(refreshTokenExpiry.getSeconds() + refreshTokenExpiresIn);

        await sessionRepo.createSession({
            userId: new mongoose.Types.ObjectId(user._id),
            deviceId,
            refreshToken,
            expiresAt: refreshTokenExpiry.toISOString()
        });

        res.setHeader('x-access-token', accessToken);
        res.setHeader('x-refresh-token', refreshToken);

        logger.info(`User signed in successfully: ${user.email}`);

        return res.status(200).json({
            status: 200,
            message: 'Sign in successful',
            data: {
                userId: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                accountType: user.accountType
            }
        });
    } catch (error) {
        logger.error('Error during sign in:', error);
        if (error instanceof AppError) {
            return res.status(error.statusCode).json(error);
        }
        return res.status(GENERIC.statusCode).json(GENERIC);
    }
};