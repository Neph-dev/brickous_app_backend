import { Request, Response } from 'express';
import { ErrorResponse } from '../../../constants';
import { AppError, logger } from '../../../shared/utils';
import { MongooseSessionRepo } from '../infra/SessionRepo';
import jwt from 'jsonwebtoken';
import { MongooseUserRepo } from '../../user/infra';

/**
 * Controller for handling token refresh operations.
 * 
 * This controller validates the refresh token, verifies its validity,
 * and issues a new access token if the refresh token is valid.
 * 
 * @param req - The Express request object containing refresh token in headers or body
 * @param req.headers['x-refresh-token'] - The refresh token provided in the request headers
 * @param req.headers['x-device-id'] - The device ID provided in the request headers
 * @param req.body.refreshToken - The refresh token provided in the request body (fallback)
 * @param req.body.deviceId - The device ID provided in the request body (fallback)
 * @param res - The Express response object
 * 
 * @returns A response with a new access token in the 'x-access-token' header if successful
 * 
 * @throws {400} - If the refresh token is missing
 * @throws {401} - If the refresh token is invalid, expired, or not found in sessions
 * @throws {404} - If the user associated with the token doesn't exist
 * @throws {500} - If a generic error occurs during processing
 */
export const refreshTokenController = async (req: Request, res: Response) => {
    const { GENERIC, NOT_FOUND, UNAUTHORIZED } = ErrorResponse;

    try {
        const refreshToken = req.headers[ 'x-refresh-token' ] as string || req.body.refreshToken;
        const deviceId = req.headers[ 'x-device-id' ] as string || req.body.deviceId;

        if (!refreshToken) {
            return res.status(400).json({
                status: 400,
                message: 'Refresh token is required',
                code: 'MISSING_REFRESH_TOKEN'
            });
        }

        const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || process.env.JWT_SECRET || '';
        const JWT_SECRET = process.env.JWT_SECRET || '';

        try {
            const decoded = jwt.verify(refreshToken, REFRESH_JWT_SECRET) as jwt.JwtPayload;
            const userId = decoded.sub;

            if (!userId) {
                logger.warn('Invalid refresh token: missing subject');
                return res.status(401).json({
                    status: 401,
                    message: 'Invalid refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }

            const sessionRepo = new MongooseSessionRepo();
            const session = deviceId
                ? await sessionRepo.getSessionByUserIdAndDevice(userId, deviceId)
                : await sessionRepo.getSessionById(refreshToken);

            if (!session || session.refreshToken !== refreshToken) {
                logger.warn(`Refresh token not found in sessions for user: ${userId}`);
                return res.status(401).json({
                    status: 401,
                    message: 'Invalid refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }

            const expiresAt = new Date(session.expiresAt);
            if (expiresAt < new Date()) {
                logger.warn(`Expired refresh token used for user: ${userId}`);
                await sessionRepo.deleteSession(session.sessionId);
                return res.status(401).json({
                    status: 401,
                    message: 'Refresh token expired',
                    code: 'REFRESH_TOKEN_EXPIRED'
                });
            }

            const userRepo = new MongooseUserRepo();
            const user = await userRepo.getById(userId);

            if (!user) {
                logger.warn(`User not found during token refresh: ${userId}`);
                return res.status(404).json(NOT_FOUND);
            }

            const accessTokenExpiresIn = 60 * 60; // 1 hour

            const payload = {
                sub: user._id,
                exp: Math.floor(Date.now() / 1000) + accessTokenExpiresIn,
                userType: user.role,
                accountType: user.accountType,
                email: user.email
            };

            const newAccessToken = jwt.sign(payload, JWT_SECRET);

            res.setHeader('x-access-token', newAccessToken);

            logger.info(`Access token refreshed for user: ${userId}`);

            return res.status(200).json({
                status: 200,
                message: 'Token refreshed successfully'
            });

        } catch (jwtError) {
            logger.warn('JWT verification failed during refresh:', jwtError);
            return res.status(401).json({
                status: 401,
                message: 'Invalid refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
        }
    } catch (error) {
        logger.error('Error during token refresh:', error);
        if (error instanceof AppError) {
            return res.status(error.statusCode).json(error);
        }
        return res.status(GENERIC.statusCode).json(GENERIC);
    }
};
