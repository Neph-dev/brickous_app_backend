import { executeDatabaseOperation } from "../../../shared/utils";
import { DeveloperType } from "../types";
import { DeveloperModel } from "./";

export interface DeveloperRepo {
    createDeveloper(data: any): Promise<void>;
    getDeveloperByUserId(userId: string): Promise<DeveloperType | null>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<void>;
    getById(id: string): Promise<any>;
    getAll(): Promise<any[]>;
}

export class MongooseDeveloperRepo implements DeveloperRepo {
    async createDeveloper(data: any): Promise<void> {
        return executeDatabaseOperation(async () => {
            const doc = new DeveloperModel(data);
            await doc.save();
        }, 'save');
    }

    async getDeveloperByUserId(userId: string): Promise<DeveloperType | null> {
        // search the array of users in the developer model and return the developer if found
        return executeDatabaseOperation(async () => {
            const developer = await DeveloperModel.findOne({ users: userId });
            if (!developer) return null;
            return developer.toObject() as DeveloperType;
        }, 'getDeveloperByUserId');
    }

    async update(id: string, data: any): Promise<any> {
        // Implementation for updating a developer in MongoDB
    }

    async delete(id: string): Promise<void> {
        // Implementation for deleting a developer in MongoDB
    }

    async getById(id: string): Promise<any> {
        // Implementation for getting a developer by ID from MongoDB
    }

    async getAll(): Promise<any[]> {
        // Implementation for getting all developers from MongoDB
        return [];
    }
}
