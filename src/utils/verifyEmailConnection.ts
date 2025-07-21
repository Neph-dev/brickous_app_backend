import nodemailer from 'nodemailer';
import { ErrorResponse } from '../constants';

export const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.zoho.com",
    port: parseInt(process.env.EMAIL_PORT || "465"),
    secure: process.env.EMAIL_SECURE !== "true",
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    ...(process.env.NODE_ENV !== 'production' && {
        debug: true,
        logger: true
    })
});

export const verifyEmailConnection = async (): Promise<boolean> => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.warn('Email credentials are missing in environment variables');
            return false;
        }
        await transporter.verify();
        return true;
    } catch (error) {
        console.error('Email connection verification failed:',
            error instanceof Error ? error.message : 'Unknown error');
        return false;
    }
};