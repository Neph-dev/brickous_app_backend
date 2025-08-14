import { Response } from 'express';
import { AppError } from './appError';
import { ErrorResponse } from '../../constants';

const { GENERIC } = ErrorResponse;

export const errorHandler = (error: unknown, res: Response) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            status: error.statusCode,
            message: error.message,
            code: error.code
        });
    } else {
        return res.status(GENERIC.statusCode).json(GENERIC);
    }
};