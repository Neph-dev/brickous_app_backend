import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res, next, options) =>
        res.status(options.statusCode).send(options.message),
    message: 'Too many requests. Please try again after 15 minutes.'
});