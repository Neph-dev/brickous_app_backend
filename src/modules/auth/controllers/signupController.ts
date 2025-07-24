import { Request, Response } from 'express';
import { ErrorResponse } from '../../../constants';
import { activateUser, createUser } from '../../user/controllers/userController';
import { MongoosePreAuthSessionRepo } from '../infra/PreAuthSessionRepo';
import { v4 as uuidv4 } from "uuid";
import { PreAuthSessionType } from '../types';
import { AppError, generateAccessToken, logger } from '../../../shared/utils';
import { MongooseUserRepo } from '../../user/infra';

/**
 * Controller for user signup process.
 * 
 * This controller handles the user registration flow by:
 * 1. Creating a new user with the provided request data
 * 2. Removing any existing pre-authentication sessions for the user's email
 * 3. Creating a new pre-authentication session with a verification code
 * 4. Responding with session details for the client to proceed with verification
 *
 * @param req - Express request object containing user registration data
 * @param res - Express response object used to send back the API response
 * 
 * @returns A Promise that resolves to an Express response with:
 *   - Status 201 and session details on successful registration
 *   - Appropriate error status and message if registration fails
 * 
 * @throws {AppError} When validation fails or other application-specific errors occur
 */
export const signupController = async (req: Request, res: Response) => {
    const { GENERIC } = ErrorResponse;

    try {
        const newUser = await createUser(req);

        const existingSession = await new MongoosePreAuthSessionRepo().getSessionByEmail(newUser.email);
        if (existingSession) {
            await new MongoosePreAuthSessionRepo().deleteSession(existingSession.preAuthSessionId);
        }

        const preAuthSessionRepo = new MongoosePreAuthSessionRepo();

        const preAuthSession: PreAuthSessionType = {
            preAuthSessionId: uuidv4(),
            email: newUser.email,
            deviceId: uuidv4(),
            code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };

        await preAuthSessionRepo.createSession(preAuthSession);

        res.status(201).json({
            status: 201,
            message: 'Signup successful. Please check your email for verification.',
            data: {
                preAuthSessionId: preAuthSession.preAuthSessionId,
                email: preAuthSession.email,
                deviceId: preAuthSession.deviceId
            }
        });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json(error);
        return res.status(GENERIC.statusCode).json(GENERIC);
    }
};

/**
 * Controller for verifying user signup using a verification code.
 * 
 * This function handles the verification process after a user signs up:
 * 1. Validates that required data (preAuthSessionId, code, deviceId) is present
 * 2. Retrieves the pre-authentication session from the database
 * 3. Verifies that the code matches and hasn't expired
 * 4. Confirms the device ID matches the session
 * 5. Activates the user account
 * 6. Deletes the pre-authentication session
 * 7. Generates access and refresh tokens for the user
 * 8. Sets authentication tokens in response headers
 * 
 * @param req - Express request object containing verification data in the body:
 *   - preAuthSessionId: Unique identifier for the pre-authentication session
 *   - code: Verification code sent to the user
 *   - deviceId: Identifier for the device making the request
 * @param res - Express response object used to send verification results to client
 * @returns Express response with appropriate status code and message
 * 
 * @throws Returns error response if verification fails for any reason
 */
export const verifySignupController = async (req: Request, res: Response) => {
    const { GENERIC, NOT_FOUND } = ErrorResponse;

    try {
        const { preAuthSessionId, code, deviceId } = req.body;

        if (!preAuthSessionId || !code || !deviceId) {
            return res.status(400).json({
                status: 400,
                message: 'Pre-auth session ID, code, and device ID are required.'
            });
        }

        const preAuthSessionRepo = new MongoosePreAuthSessionRepo();
        const session = await preAuthSessionRepo.getSessionById(preAuthSessionId);

        if (!session) {
            return res.status(NOT_FOUND.statusCode).json(NOT_FOUND);
        }

        if (session.code !== code) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid verification code.'
            });
        }

        if (new Date(session.expiresAt) < new Date()) {
            return res.status(400).json({
                status: 400,
                message: 'Verification code has expired.'
            });
        }

        if (session.deviceId !== deviceId) {
            return res.status(400).json({
                status: 400,
                message: 'Device ID does not match.'
            });
        }

        await activateUser(session.email);
        await preAuthSessionRepo.deleteSession(preAuthSessionId);


        const userRepo = new MongooseUserRepo();
        const user = await userRepo.getByEmail(session.email);
        if (!user || !user._id) {
            logger.info('User not found after activation', {
                email: session.email,
                preAuthSessionId: session.preAuthSessionId
            });
            return res.status(NOT_FOUND.statusCode).json(NOT_FOUND);
        }

        const { accessToken, refreshToken } = generateAccessToken(user);

        res.setHeader('x-access-token', accessToken);
        res.setHeader('x-refresh-token', refreshToken);

        res.status(200).json({
            status: 200,
            message: 'Signup verified successfully.'
        });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json(error);
        return res.status(GENERIC.statusCode).json(GENERIC);
    }
};