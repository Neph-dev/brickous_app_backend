import rateLimit, { Options as RateLimitOptions } from "express-rate-limit";

export const createRateLimiter = (options?: Partial<RateLimitOptions>) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000, // Default: 15 minutes
        max: 100, // Default: 100 requests per windowMs
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        handler: (req, res, next, options) =>
            res.status(options.statusCode).send(options.message),
        message: 'Too many requests. Please try again after 15 minutes.',
        ...options // Override defaults with provided options
    });
};