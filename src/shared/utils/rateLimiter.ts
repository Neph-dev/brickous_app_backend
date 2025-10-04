import rateLimit, { Options as RateLimitOptions } from "express-rate-limit";

const RATE_LIMIT_WINDOW_MINUTES: number = Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15;
const RATE_LIMIT_MAX: number = Number(process.env.RATE_LIMIT_MAX) || 100;

export const createRateLimiter = (options?: Partial<RateLimitOptions>) => {
    return rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000, // Default: 15 minutes
        max: RATE_LIMIT_MAX, // Default: 100 requests per windowMs
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        handler: (req, res, next, options) =>
            res.status(options.statusCode).send(options.message),
        message: 'Too many requests. Please try again after 15 minutes.',
        ...options // Override defaults with provided options
    });
};