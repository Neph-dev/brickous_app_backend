import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/utils';
import { ErrorResponse } from '../constants';

const JWT_SECRET = process.env.JWT_SECRET || '';
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

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.headers[ "st-access-token" ] as string;

        if (!accessToken) {
            logger.warn('Authentication failed: No access token provided');
            return res.status(401).json(MISSING_TOKEN);
        }

        if (!JWT_SECRET) {
            logger.error('JWT_SECRET is not configured');
            return res.status(500).json(JWT_SECRET_MISSING);
        }

        const decoded = jwt.verify(accessToken, JWT_SECRET) as jwt.JwtPayload;

        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            logger.warn('Authentication failed: Token has expired');
            return res.status(401).json(TOKEN_EXPIRED);
        }

        req.user = decoded;

        logger.info(`User authenticated successfully: ${decoded.sub}`);
        next();

    } catch (error) {
        logger.error('Authentication failed:', error);

        return res.status(UNAUTHORIZED.statusCode).json({
            statusCode: UNAUTHORIZED.statusCode,
            message: UNAUTHORIZED.message,
            code: "AUTH_ERROR"
        });
    }
};