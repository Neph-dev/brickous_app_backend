import express, { NextFunction, Request, Response } from 'express';
import { signupController, verifySignupController } from '../controllers/signupController';
import { signinController } from '../controllers/signinController';
import { logoutController, getActiveSessions } from '../controllers/sessionController';
import { refreshTokenController } from '../controllers/refreshTokenController';
import { hashPasswordMiddleware, requireAuth } from '../../../middlewares';
import { createRateLimiter } from '../../../shared/utils/rateLimiter';

const authRouter = express.Router();

// Rate limiters for sensitive operations
const rateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many attempts, please try again after 15 minutes.'
});

// Registration routes
authRouter.post('/signup', rateLimiter, hashPasswordMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await signupController(req, res);
    } catch (error) {
        next(error);
    }
});

authRouter.post('/signup/verify', rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await verifySignupController(req, res);
    } catch (error) {
        next(error);
    }
});

// Authentication routes
authRouter.post('/signin', rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await signinController(req, res);
    } catch (error) {
        next(error);
    }
});

authRouter.post('/refresh-token', rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await refreshTokenController(req, res);
    } catch (error) {
        next(error);
    }
});

// Session management routes (require authentication)
authRouter.post('/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await logoutController(req, res);
    } catch (error) {
        next(error);
    }
});

authRouter.get('/sessions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getActiveSessions(req, res);
    } catch (error) {
        next(error);
    }
});

export default authRouter;