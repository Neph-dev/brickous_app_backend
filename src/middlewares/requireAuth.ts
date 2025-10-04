import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/utils';
import { ErrorResponse } from '../constants';
import { MongooseSessionRepo } from '../modules/auth/infra/SessionRepo';
import { MongooseUserRepo } from '../modules/user/infra';

const JWT_SECRET = process.env.JWT_SECRET || '';
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || JWT_SECRET;
const {
    UNAUTHORIZED,
    MISSING_TOKEN,
    JWT_SECRET_MISSING,
    TOKEN_EXPIRED
} = ErrorResponse;

declare global {
    namespace Express {
        interface Request {
            user?: jwt.JwtPayload;
        }
    }
}

/**
 * Authentication middleware to validate JWT tokens and handle automatic token refresh
 * 
 * This middleware performs the following operations:
 * 1. Validates the provided access token
 * 2. If the token is valid, adds the user information to the request object
 * 3. If the access token is expired, attempts to use the refresh token to generate a new access token
 * 4. If refresh is successful, updates the request with user information and adds a new token to the response headers
 * 
 * @param req - Express request object containing authentication headers:
 *   - x-access-token: JWT access token
 *   - x-refresh-token: JWT refresh token for automatic renewal
 *   - x-device-id: Optional device identifier for session validation
 * @param res - Express response object
 * @param next - Express next function to continue to the next middleware
 * 
 * @returns {void} Calls next() on success or returns an error response
 * 
 * @throws {401} MISSING_TOKEN - If no access token is provided
 * @throws {500} JWT_SECRET_MISSING - If the JWT secret is not configured
 * @throws {401} TOKEN_EXPIRED - If the token is expired and refresh fails
 * @throws {401} REFRESH_TOKEN_EXPIRED - If the refresh token has expired
 * @throws {401} UNAUTHORIZED - For other authentication errors
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.headers["x-access-token"] as string;
        const refreshToken = req.headers["x-refresh-token"] as string;
        const deviceId = req.headers["x-device-id"] as string;

        if (!accessToken) {
            logger.warn('Authentication failed: No access token provided');
            return res.status(401).json(MISSING_TOKEN);
        }

        if (!JWT_SECRET) {
            logger.error('JWT_SECRET is not configured');
            return res.status(500).json(JWT_SECRET_MISSING);
        }

        try {
            const decoded = jwt.verify(accessToken, JWT_SECRET) as jwt.JwtPayload;

            req.user = decoded;
            logger.info(`User authenticated successfully: ${decoded.sub}`);
            return next();

        } catch (tokenError) {
            if (tokenError instanceof jwt.TokenExpiredError && refreshToken) {
                logger.info('Access token expired, attempting automatic refresh');

                try {
                    const refreshDecoded = jwt.verify(refreshToken, REFRESH_JWT_SECRET) as jwt.JwtPayload;
                    const userId = refreshDecoded.sub;

                    if (!userId) {
                        logger.warn('Invalid refresh token: missing subject');
                        return res.status(401).json(TOKEN_EXPIRED);
                    }

                    const sessionRepo = new MongooseSessionRepo();
                    const session = deviceId
                        ? await sessionRepo.getSessionByUserIdAndDevice(userId.toString(), deviceId)
                        : await sessionRepo.getSessionById(refreshToken);

                    if (!session || session.refreshToken !== refreshToken) {
                        logger.warn(`Refresh token not found in sessions for user: ${userId}`);
                        return res.status(401).json(TOKEN_EXPIRED);
                    }

                    const expiresAt = new Date(session.expiresAt);
                    if (expiresAt < new Date()) {
                        logger.warn(`Expired refresh token used for user: ${userId}`);
                        await sessionRepo.deleteSession(session.sessionId);
                        return res.status(401).json({
                            statusCode: 401,
                            message: 'Refresh token expired',
                            code: 'REFRESH_TOKEN_EXPIRED'
                        });
                    }

                    const userRepo = new MongooseUserRepo();
                    const user = await userRepo.getById(userId.toString());

                    if (!user) {
                        logger.warn(`User not found during token refresh: ${userId}`);
                        return res.status(401).json(TOKEN_EXPIRED);
                    }

                    const accessTokenExpiresIn = 6 * 60 * 60; // 6 hours

                    const payload = {
                        sub: user._id,
                        exp: Math.floor(Date.now() / 1000) + accessTokenExpiresIn,
                        userType: user.role,
                        accountType: user.accountType,
                        email: user.email
                    };

                    const newAccessToken = jwt.sign(payload, JWT_SECRET);

                    res.setHeader('x-access-token', newAccessToken);

                    req.user = payload;
                    logger.info(`Token automatically refreshed for user: ${userId}`);
                    return next();

                } catch (refreshError) {
                    logger.warn('Failed to refresh token:', refreshError);
                    return res.status(401).json(TOKEN_EXPIRED);
                }
            } else {
                logger.warn('Authentication failed:', tokenError);
                return res.status(401).json(TOKEN_EXPIRED);
            }
        }
    } catch (error) {
        logger.error('Authentication failed:', error);

        return res.status(UNAUTHORIZED.statusCode).json({
            statusCode: UNAUTHORIZED.statusCode,
            message: UNAUTHORIZED.message,
            code: "AUTH_ERROR"
        });
    }
};