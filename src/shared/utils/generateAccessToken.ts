import jwt from 'jsonwebtoken';
import { logger } from './logger';
import { AppError } from './appError';

const JWT_SECRET = process.env.JWT_SECRET || '';
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || JWT_SECRET;

export const generateAccessToken = (
    user: any,
    expiresIn: number = 60 * 60, // Default to 1 hour
    refreshExpiresIn: number = 7 * 24 * 60 * 60 // Default to 7 days
) => {
    try {
        if (!user || !user._id) {
            throw new AppError('User not found', 'ERR_USER_NOT_FOUND', 404);
        }
        if (!JWT_SECRET) {
            logger.error('JWT_SECRET is not configured');
            throw new AppError('JWT_SECRET is not configured',
                'ERR_JWT_SECRET_MISSING',
                500
            );
        }
        const payload = {
            sub: user._id,
            userType: user.role,
            accountType: user.accountType
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn });
        const refreshToken = jwt.sign({ sub: user._id }, REFRESH_JWT_SECRET, { expiresIn: refreshExpiresIn });

        return {
            accessToken,
            refreshToken
        };
    } catch (error) {
        logger.error('Error setting access token:', error);
        throw new AppError('Failed to set access token', 'ERR_SET_ACCESS_TOKEN', 500);
    }
};