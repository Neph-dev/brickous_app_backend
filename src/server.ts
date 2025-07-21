import dotenv from 'dotenv';
dotenv.config();
globalThis.crypto ??= require("node:crypto").webcrypto;

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

import { logger, rateLimiter, verifyEmailConnection } from './utils';
import { ErrorResponse } from './constants';
import apiRouter from './routes';
import propertyRouter from './modules/property/routes/propertyRoutes';
import developerRouter from './modules/developer/routes/developerRoutes';


const { UNAUTHORIZED, GENERIC, NOT_FOUND } = ErrorResponse;


const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || '';
const NODE_ENV = process.env.NODE_ENV || 'development';

const missingVars: string[] = [];

if (!MONGODB_URI) missingVars.push('MONGODB_URI');

if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

const app = express();

app.use(helmet());

const allowedOrigins = [ 'http://localhost:3000' ];
if (NODE_ENV === 'production') {
    allowedOrigins.push('');
}

// ! Uncomment the following lines to enforce HTTPS in production
// app.use((req, res, next) => {
//     if (process.env.NODE_ENV === 'production' && !req.secure) {
//         if (req.headers[ 'x-forwarded-proto' ] !== 'https') {
//             return res.redirect(`https://${req.headers.host}${req.url}`);
//         }
//     }
//     next();
// });

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(UNAUTHORIZED.message));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.get('/api/v1/health', async (req: Request, res: Response): Promise<void> => {
    try {
        const dbStatus = mongoose.connection.db ? await mongoose.connection.db.admin().ping() : false;
        const emailStatus = await verifyEmailConnection();

        res.status(200).json({
            status: 'OK',
            environment: NODE_ENV,
            database: dbStatus ? 'connected' : 'error',
            emailService: emailStatus ? 'configured' : 'error',
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: 'Health check failed' });
    }
});

app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = req.headers[ 'x-request-id' ] || crypto.randomUUID();

    res.setHeader('X-Request-ID', requestId);

    logger.info('Request received', {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referrer') || req.get('Referer'),
        hasAuth: !!req.headers.authorization
    });

    res.on('finish', () => {
        const duration = Date.now() - start;

        const level = res.statusCode >= 500 ? 'error' :
            res.statusCode >= 400 ? 'warn' : 'info';

        logger[ level ]('Request completed', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            contentLength: res.get('Content-Length'),
            userId: req.body.auth?.sub || 'unauthenticated'
        });

        if (res.statusCode === 401 || res.statusCode === 403) {
            logger.warn('Security event: Authorization failure', {
                requestId,
                method: req.method,
                path: req.path,
                ip: req.ip,
                userId: req.body.auth?.sub || 'unauthenticated'
            });
        }
    });

    next();

    app.use('/api/v1', apiRouter);
});
app.use('/api/v1', propertyRouter);
app.use('/api/v1', developerRouter);

app.use((req: Request, res: Response) => {
    res.status(NOT_FOUND.statusCode).json({ NOT_FOUND });
});

app.use((err: any, req: Request, res: any, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(UNAUTHORIZED.statusCode).json({
            error: UNAUTHORIZED.message
        });
    }

    if (NODE_ENV !== 'production') {
        console.error('Error:', err);
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        error: NODE_ENV === 'production' ? GENERIC.message : err.message || GENERIC.message
    });
});

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 7000,
            socketTimeoutMS: 45000,
            // ! Uncomment the following lines to enforce SSL in production
            // ssl: process.env.NODE_ENV === 'production',
            // tlsAllowInvalidCertificates: false
        });
        console.log('✅ Connected to MongoDB with Mongoose');
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err);
        process.exit(1);
    }
};

connectDB();

process.on('SIGINT', async () => {
    await mongoose.disconnect();
    console.log('🛑 MongoDB connection closed due to app termination');
    process.exit(0);
});