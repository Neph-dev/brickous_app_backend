import { executeDatabaseOperation } from "../../../shared/utils";
import { PropertyModel } from "./";

export interface PropertyRepo {
    save(data: any): Promise<void>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<void>;
    getById(id: string): Promise<any>;
    getAll(): Promise<any[]>;
}

export class MongoosePropertyRepo implements PropertyRepo {
    async save(data: any): Promise<void> {
        return executeDatabaseOperation(async () => {
            const doc = new PropertyModel(data);
            await doc.save();
        }, 'save');
    }

    async update(id: string, data: any): Promise<any> {
        // Implementation for updating a property in MongoDB
    }

    async delete(id: string): Promise<void> {
        // Implementation for deleting a property in MongoDB
    }

    async getById(id: string): Promise<any> {
        // Implementation for getting a property by ID from MongoDB
    }

    async getAll(): Promise<any[]> {
        // Implementation for getting all properties from MongoDB
        return [];
    }
}