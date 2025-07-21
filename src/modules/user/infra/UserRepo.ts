import { executeDatabaseOperation } from "../../../shared/utils";
import { UserModel } from "./UserModel";

export interface UserRepo {
    save(data: any): Promise<void>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<void>;
    getById(id: string): Promise<any>;
    getByEmail(email: string): Promise<any>;
}

export class MongooseUserRepo implements UserRepo {
    async save(data: any): Promise<void> {
        return executeDatabaseOperation(async () => {
            const doc = new UserModel(data);
            await doc.save();
        }, 'save');
    }

    async update(id: string, data: any): Promise<any> {
    }

    async delete(id: string): Promise<void> {
    }

    async getById(id: string): Promise<any> {
        return executeDatabaseOperation(async () => {
            return UserModel.findById(id);
        }, 'getById');
    }

    async getByEmail(email: string): Promise<any> {
        return executeDatabaseOperation(async () => {
            return UserModel.findOne({ email });
        }, 'getByEmail');
    }
}