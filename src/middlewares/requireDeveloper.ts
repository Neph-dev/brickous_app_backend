import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';
import { ErrorResponse } from '../constants';
import { requireAuth } from './requireAuth';

const { UNAUTHORIZED, NOT_FOUND } = ErrorResponse;

export const checkDeveloperExists = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAuth(req, res, async (err) => {
            if (err) {
                return next(err);
            }

            const sub = req.body.auth?.sub;
            if (!sub) {
                return res.status(401).json(UNAUTHORIZED);
            }

            const developerRepo = new MongooseDeveloperRepo();
            const developer = await developerRepo.findBySub(sub);

            if (developer) (req as any).developer = developer;

            logger.info(`Developer check for ${req.path}`, {
                sub,
                developerFound: !!developer,
                path: req.path,
                method: req.method
            });

            next();
        });
    } catch (error) {
        logger.error('Error in checkDeveloperExists middleware', {
            error: error instanceof Error ? error.message : 'Unknown error',
            path: req.path
        });
        res.status(UNAUTHORIZED.statusCode).json(UNAUTHORIZED);
        next(error);
    }
};

export const requireDeveloper = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await checkDeveloperExists(req, res, () => {
            if (!req.headers.authorization) {
                return res.status(401).json(UNAUTHORIZED);
            }

            if (!(req as any).developer) {
                logger.info('Developer not found', {
                    sub: req.body.auth?.sub,
                    path: req.path,
                    method: req.method
                });
                return res.status(NOT_FOUND.statusCode).json({ NOT_FOUND });
            }
            next();
        });
    } catch (error) {
        logger.error('Error in requireDeveloper middleware', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(UNAUTHORIZED.statusCode).json(UNAUTHORIZED);
        next(error);
    }
};