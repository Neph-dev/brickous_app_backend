import { Request, Response } from 'express';

import { ErrorResponse } from '../../../constants';
import { AppError } from '../../../utils';
import { validateDeveloperFields } from '../utils';
import { MongooseDeveloperRepo } from '../infra';

export const createDeveloper = async (req: Request, res: Response) => {
    const { GENERIC } = ErrorResponse;

    try {
        const repo = new MongooseDeveloperRepo();

        validateDeveloperFields(req.body);

        await repo.save(req.body);

        res.status(201).json({
            status: 201,
            message: 'Developer created successfully'
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                status: error.statusCode,
                message: error.message
            });
        } else {
            res.status(GENERIC.statusCode).json(GENERIC);
        }
    }
};
