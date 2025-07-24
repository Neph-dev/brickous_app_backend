import { Request, Response } from 'express';
import { ErrorResponse } from '../../../constants';
import { AppError, logger } from '../../../shared/utils';
import { MongooseSessionRepo } from '../infra/SessionRepo';

/**
 * Controller for handling user logout operations.
 * 
 * This controller supports three logout scenarios:
 * 1. Logout from all devices (logoutAll = true)
 * 2. Logout from a specific session by sessionId
 * 3. Logout from the current device using the device ID from headers
 *
 * @param req - Express Request object containing user authentication data and logout parameters
 * @param res - Express Response object used to send the appropriate HTTP response
 * 
 * @returns HTTP response with status code and message indicating success or failure
 * - 200: Successful logout
 * - 400: Missing required information
 * - 401: User not authenticated
 * - 403: Unauthorized attempt to log out of another user's session
 * - 404: Session not found
 * - 500: Generic server error
 * 
 * @throws Will pass any caught AppError with its status code, or return a generic error response
 */
export const logoutController = async (req: Request, res: Response) => {
    const { GENERIC, UNAUTHORIZED } = ErrorResponse;

    try {
        if (!req.user || !req.user.sub) {
            return res.status(401).json({
                status: 401,
                message: 'Not authenticated',
                code: 'NOT_AUTHENTICATED'
            });
        }

        const userId = req.user.sub.toString();
        const deviceId = req.headers[ 'x-device-id' ] as string;
        const refreshToken = req.headers[ 'x-refresh-token' ] as string;
        const { sessionId, logoutAll } = req.body;
        const sessionRepo = new MongooseSessionRepo();

        if (logoutAll) {
            await sessionRepo.deleteAllUserSessions(userId);

            logger.info(`User logged out from all devices: ${userId}`);

            return res.status(200).json({
                status: 200,
                message: 'Logged out from all devices successfully'
            });
        } else if (sessionId) {
            const session = await sessionRepo.getSessionById(sessionId);

            if (!session) {
                return res.status(404).json({
                    status: 404,
                    message: 'Session not found',
                    code: 'SESSION_NOT_FOUND'
                });
            }

            if (session.userId.toString() !== userId) {
                logger.warn(`User ${userId} attempted to log out of another user's session ${sessionId}`);
                return res.status(403).json(UNAUTHORIZED);
            }

            await sessionRepo.deleteSession(sessionId);

            logger.info(`User logged out from session: ${sessionId}`);

            return res.status(200).json({
                status: 200,
                message: 'Logged out successfully'
            });
        } else {
            const deviceId = req.headers[ 'x-device-id' ] as string;

            if (!deviceId) {
                return res.status(400).json({
                    status: 400,
                    message: 'No session ID or device ID provided',
                    code: 'MISSING_SESSION_INFO'
                });
            }

            const session = await sessionRepo.getSessionByUserIdAndDevice(userId, deviceId);

            if (!session) {
                return res.status(404).json({
                    status: 404,
                    message: 'No active session found for this device',
                    code: 'SESSION_NOT_FOUND'
                });
            }

            await sessionRepo.deleteSession(session.sessionId);

            logger.info(`User logged out from device: ${deviceId}`);

            return res.status(200).json({
                status: 200,
                message: 'Logged out successfully'
            });
        }
    } catch (error) {
        logger.error('Error during logout:', error);
        if (error instanceof AppError) {
            return res.status(error.statusCode).json(error);
        }
        return res.status(GENERIC.statusCode).json(GENERIC);
    }
};

/**
 * Retrieves all active sessions for the authenticated user.
 * 
 * This controller function:
 * 1. Verifies that the user is authenticated
 * 2. Fetches all active sessions for the user from the database
 * 3. Sanitizes the session data (removing sensitive information)
 * 4. Returns the list of active sessions
 * 
 * @param {Request} req - Express request object containing user authentication details in req.user
 * @param {Response} res - Express response object used to send the HTTP response
 * 
 * @returns {Promise<Response>} JSON response with:
 * - 200 status and array of sanitized sessions if successful
 * - 401 status if user is not authenticated
 * - Appropriate error status and message if an exception occurs
 * 
 * @throws {AppError} Propagates application-specific errors with their status codes
 */
export const getActiveSessions = async (req: Request, res: Response) => {
    const { GENERIC } = ErrorResponse;

    try {
        if (!req.user || !req.user.sub) {
            return res.status(401).json({
                status: 401,
                message: 'Not authenticated',
                code: 'NOT_AUTHENTICATED'
            });
        }

        const userId = req.user.sub;
        const sessionRepo = new MongooseSessionRepo();

        const activeSessions = await sessionRepo.getActiveSessionsByUserId(userId);

        const sanitizedSessions = activeSessions.map(session => ({
            sessionId: session.sessionId,
            deviceId: session.deviceId,
            expiresAt: session.expiresAt,
            createdAt: session.createdAt
        }));

        return res.status(200).json({
            status: 200,
            message: 'Active sessions retrieved successfully',
            data: sanitizedSessions
        });
    } catch (error) {
        logger.error('Error retrieving active sessions:', error);
        if (error instanceof AppError) {
            return res.status(error.statusCode).json(error);
        }
        return res.status(GENERIC.statusCode).json(GENERIC);
    }
};
