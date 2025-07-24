import { Request } from 'express';
import { AppError } from '../../../shared/utils';
import { MongooseUserRepo } from '../infra';
import { AccountStatus, CreateUserResponse, UserCreationType, UserRole } from '../types';

export const createUser = async (req: Request): Promise<CreateUserResponse> => {
    const repo = new MongooseUserRepo();

    const existingUser = await repo.getByEmail(req.body.email);

    if (existingUser && existingUser.status === AccountStatus.Inactive) {
        return {
            id: existingUser._id,
            email: existingUser.email,
            role: existingUser.role as UserRole,
            status: existingUser.status,
            type: UserCreationType.EXISTING_USER
        };
    }

    if (existingUser && existingUser.status !== AccountStatus.Inactive) {
        throw new AppError('User already exists', 'USER_EXISTS', 400);
    }

    const newUser = await repo.createUser(req.body);

    return {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role as UserRole,
        status: newUser.status as AccountStatus,
        type: UserCreationType.NEW_USER
    };
};

export const activateUser = async (email: string): Promise<any> => {
    const repo = new MongooseUserRepo();

    const user = await repo.getByEmail(email);
    if (!user || !user._id) throw new AppError('User not found', 'USER_NOT_FOUND', 404);

    if (user.status === AccountStatus.Active) {
        return {
            status: 200,
            message: 'User is already active',
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                status: user.status
            }
        };
    }

    const updatedUser = await repo.update(
        user._id, {
        status: AccountStatus.Active,
        isConfirmed: true
    });
    if (!updatedUser) throw new AppError('Failed to activate user', 'USER_ACTIVATION_FAILED', 500);

    return {
        status: 200,
        message: 'User activated successfully',
        data: {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status
        }
    };
};