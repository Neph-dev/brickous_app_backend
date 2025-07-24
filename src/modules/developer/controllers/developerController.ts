import { Request, Response } from 'express';

import { ErrorResponse } from '../../../constants';
import { AppError } from '../../../shared/utils';
import { validateDeveloperFields } from '../utils';
import { MongooseDeveloperRepo } from '../infra';
import { MongooseUserRepo } from '../../user/infra';
import { UserRole } from '../../user/types/UserRole';

export const createDeveloper = async (req: Request, res: Response) => {
    const { GENERIC } = ErrorResponse;

    try {
        validateDeveloperFields(req.body);

        const userRepo = new MongooseUserRepo();
        if (!req.user || !req.user.sub) {
            throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
        }

        const updatedUser = await userRepo.updateRole(req.user.sub, UserRole.Admin);
        if (!updatedUser) {
            throw new AppError('Failed to update user role', 'USER_ROLE_UPDATE_FAILED', 500);
        }

        const developerData = {
            ...req.body,
            users: [ updatedUser._id ]
        };

        const repo = new MongooseDeveloperRepo();


        const developer = await repo.getDeveloperByUserId(req.user.sub);
        if (developer) {
            throw new AppError('Developer already exists', 'DEVELOPER_ALREADY_EXISTS', 409);
        }

        await repo.createDeveloper(developerData);

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
