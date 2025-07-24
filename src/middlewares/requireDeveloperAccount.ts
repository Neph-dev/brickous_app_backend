import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/utils';
import { ErrorResponse } from '../constants';
import { requireAuth } from './requireAuth';
import { MongooseUserRepo } from '../modules/user/infra';
import { AccountType } from '../modules/user/types';

const { UNAUTHORIZED, NOT_FOUND } = ErrorResponse;

export const requireDeveloperAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await requireAuth(req, res, async (err) => {
            if (err) return next(err);
        });

        const userRepo = new MongooseUserRepo();

        if (!req.user?.sub) {
            return res.status(NOT_FOUND.statusCode).json(NOT_FOUND);
        }

        const user = await userRepo.getById(req.user.sub);

        if (!user) {
            logger.info('User not found', {
                sub: req.user.sub,
            });
            return res.status(NOT_FOUND.statusCode).json(NOT_FOUND);
        }

        if (user.accountType !== AccountType.Developer) {
            logger.info('User is not a developer', {
                sub: req.user.sub,
                role: user.role
            });
            return res.status(UNAUTHORIZED.statusCode).json(UNAUTHORIZED);
        }

        (req as any).developer = user;

        next();
    } catch (error) {
        logger.error('Error in requireDeveloperAccount middleware', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        res.status(UNAUTHORIZED.statusCode).json(UNAUTHORIZED);

        next(error);
    }
};