import { Request, Response } from 'express';

import { ErrorResponse } from '../../../constants';
import { AppError } from '../../../shared/utils';
import { validatePropertyFields } from '../utils';
import { MongoosePropertyRepo } from '../infra';

export const createProperty = async (req: Request, res: Response) => {
    const { GENERIC } = ErrorResponse;

    try {
        const repo = new MongoosePropertyRepo();

        validatePropertyFields(req.body);

        await repo.save(req.body);

        res.status(201).json({
            status: 201,
            message: 'Property created'
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                message: error.message,
                code: error.code,
                status: error.statusCode,
            });
        }

        res.status(500).json(GENERIC);
    }


};