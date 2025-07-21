import { Request, Response } from 'express';
import { ErrorResponse } from '../../../constants';
import { AppError } from '../../../utils';
import { MongooseUserRepo } from '../infra';

export const createUser = async (req: Request, res: Response) => {
    const { GENERIC } = ErrorResponse;

    try {
        const repo = new MongooseUserRepo();

        await repo.save(req.body);

        res.status(201).json({
            status: 201,
            message: 'User created successfully'
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