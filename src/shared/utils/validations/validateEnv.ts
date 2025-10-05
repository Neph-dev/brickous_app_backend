/**
 * Validate required environment variables.
 * If any are missing, log an error and throw — causing the process to exit.
 */
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const AWS_REGION = process.env.AWS_REGION || '';
const AWS_S3_IMAGES_BUCKET_NAME = process.env.AWS_S3_IMAGES_BUCKET_NAME || '';

const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const JWT_SECRET = process.env.JWT_SECRET || '';

export const validateEnv = (requiredVars?: Record<string, string | undefined>): void => {
    const missing = Object.entries({
        MONGODB_URI,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        AWS_REGION,
        AWS_S3_IMAGES_BUCKET_NAME,
        EMAIL_USER,
        EMAIL_PASSWORD,
        JWT_SECRET,
        ...requiredVars
    })
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        const message = `❌ Missing required environment variables: ${missing.join(', ')}`;
        console.error(message);
        throw new Error(message);
    }
};