import { executeDatabaseOperation } from "../../../shared/utils";
import { DeveloperModel } from "./";

export interface DeveloperRepo {
    save(data: any): Promise<void>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<void>;
    getById(id: string): Promise<any>;
    getAll(): Promise<any[]>;
}

export class MongooseDeveloperRepo implements DeveloperRepo {
    async save(data: any): Promise<void> {
        return executeDatabaseOperation(async () => {
            const doc = new DeveloperModel(data);
            await doc.save();
        }, 'save');
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
