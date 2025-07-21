import express, { NextFunction, Request, Response } from 'express';
import { hashPasswordMiddleware } from '../../../middlewares';
import { createUser } from '../controllers/UserController';

const userRouter = express.Router();

userRouter.post('/create-user', hashPasswordMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await createUser(req, res);
    } catch (error) {
        next(error);
    }
});


export default userRouter;