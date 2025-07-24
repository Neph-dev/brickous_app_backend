import { AppError, executeDatabaseOperation } from "../../../shared/utils";
import { AccountStatus, UserType, UserRole } from "../types";
import { UserModel } from "./UserModel";

export interface UserRepo {
    createUser(data: UserType): Promise<UserType>;
    update(id: string, data: any): Promise<any>;
    updateRole(id: string, role: UserRole): Promise<UserType>;
    delete(id: string): Promise<void>;
    getById(id: string): Promise<any>;
    getByEmail(email: string): Promise<any>;
}

export class MongooseUserRepo implements UserRepo {

    async createUser(data: UserType): Promise<UserType> {
        data.status = AccountStatus.Inactive;
        data.isConfirmed = false;
        data.role = UserRole.User;

        return executeDatabaseOperation(async () => {
            const doc = new UserModel(data);
            await doc.save();
            return doc.toObject();
        }, 'createUser');
    }

    async update(id: string, data: any): Promise<any> {
        return executeDatabaseOperation(async () => {
            const user = await UserModel.findById(id);
            if (!user) throw new AppError('User not found', 'USER_NOT_FOUND', 404);
            Object.assign(user, data);
            await user.save();
            return user.toObject();
        }, 'update');
    }

    async updateRole(id: string, role: UserRole): Promise<UserType> {
        return executeDatabaseOperation(async () => {
            const user = await UserModel.findById(id);
            if (!user) throw new AppError('User not found', 'USER_NOT_FOUND', 404);
            user.role = role;
            await user.save();
            return user.toObject();
        }, 'updateRole');
    }

    async delete(id: string): Promise<void> {
    }

    async getById(id: string): Promise<any> {
        return executeDatabaseOperation(async () => {
            return UserModel.findById(id);
        }, 'getById');
    }

    async getByEmail(email: string): Promise<UserType | null> {
        return executeDatabaseOperation(async () => {
            return UserModel.findOne({ email });
        }, 'getByEmail');
    }
}