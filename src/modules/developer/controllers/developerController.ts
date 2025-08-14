import { Request, Response } from 'express';

import { ErrorResponse } from '../../../constants';
import { AppError, errorHandler } from '../../../shared/utils';
import { validateDeveloperFields } from '../utils';
import { MongooseDeveloperRepo } from '../infra';
import { MongooseUserRepo } from '../../user/infra';
import { UserRole } from '../../user/types/UserRole';

const { GENERIC } = ErrorResponse;

export class DeveloperController {
    private developerRepo: MongooseDeveloperRepo;
    private userRepo: MongooseUserRepo;

    constructor() {
        this.developerRepo = new MongooseDeveloperRepo();
        this.userRepo = new MongooseUserRepo();
    }

    createDeveloper = async (req: Request, res: Response) => {
        try {
            validateDeveloperFields(req.body);

            if (!req.user || !req.user.sub) {
                throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
            }

            const [ existingByUser, existingByEmail ] = await Promise.all([
                this.developerRepo.getDeveloperByUserId(req.user.sub),
                this.developerRepo.getDeveloperByEmail(req.body.email)
            ]);

            if (existingByUser) {
                throw new AppError('Developer already exists', 'DEVELOPER_ALREADY_EXISTS', 409);
            }

            if (existingByEmail) {
                throw new AppError('Developer email already in use', 'DEVELOPER_EMAIL_ALREADY_IN_USE', 409);
            }

            const developerData = {
                ...req.body,
                users: [ req.user.sub ]
            };

            await this.developerRepo.createDeveloper(developerData);

            const updatedUser = await this.userRepo.updateRole(req.user.sub, UserRole.Admin);
            if (!updatedUser) {
                throw new AppError('Failed to update user role', 'USER_ROLE_UPDATE_FAILED', 500);
            }

            return res.status(201).json({
                status: 201,
                message: 'Developer created successfully'
            });
        } catch (error) {
            return errorHandler(error, res);
        }
    };

    getDeveloperByUserId = async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.sub) {
                throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
            }

            const developer = await this.developerRepo.getDeveloperByUserId(req.user.sub);

            if (!developer) {
                return res.status(404).json({
                    status: 404,
                    message: 'Developer not found',
                    code: 'DEVELOPER_NOT_FOUND'
                });
            }

            return res.status(200).json({
                status: 200,
                message: 'Developer retrieved successfully',
                data: developer
            });
        } catch (error) {
            return errorHandler(error, res);
        }
    };

    // private errorHandler(error: unknown, res: Response) {
    //     if (error instanceof AppError) {
    //         return res.status(error.statusCode).json({
    //             status: error.statusCode,
    //             message: error.message,
    //             code: error.code
    //         });
    //     } else {
    //         return res.status(GENERIC.statusCode).json(GENERIC);
    //     }
    // }
}