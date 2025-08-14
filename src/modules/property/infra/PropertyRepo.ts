import { ErrorResponse } from "../../../constants";
import { AppError, executeDatabaseOperation } from "../../../shared/utils";
import { PropertyModel } from "./";

export interface PropertyRepo {
    save(data: any): Promise<void>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<any>;
    getAll(): Promise<any[]>;
}

const { NOT_FOUND } = ErrorResponse;

export class MongoosePropertyRepo implements PropertyRepo {
    async save(data: any): Promise<void> {
        return executeDatabaseOperation(async () => {
            const doc = new PropertyModel(data);
            await doc.save();
        }, 'save');
    }

    async update(id: string, data: any): Promise<any> {
        return executeDatabaseOperation(async () => {
            const updatedDoc = await PropertyModel.findByIdAndUpdate(id, data, { new: true });
            if (!updatedDoc) throw new AppError('Property not found', NOT_FOUND.code, NOT_FOUND.statusCode);
            return updatedDoc;
        }, 'update');
    }

    async delete(id: string): Promise<void> {
        // Implementation for deleting a property in MongoDB
    }

    async findById(id: string): Promise<any> {
        return executeDatabaseOperation(async () => {
            const doc = await PropertyModel.findById(id);
            if (!doc) throw new AppError('Property not found', NOT_FOUND.code, NOT_FOUND.statusCode);
            return doc;
        }, 'findById');
    }

    async getAll(): Promise<any[]> {
        // Implementation for getting all properties from MongoDB
        return [];
    }
}