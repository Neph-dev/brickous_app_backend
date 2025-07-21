import { hashPassword } from "../modules/user/utils";

import { Request, Response, NextFunction } from 'express';

export const hashPasswordMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.body.password) {
            req.body.password = await hashPassword(req.body.password);
        }
        next();
    } catch (error) {
        next(error);
    }
};
