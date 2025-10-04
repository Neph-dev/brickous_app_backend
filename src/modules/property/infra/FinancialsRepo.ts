import { ErrorResponse } from "../../../constants";
import { AppError, executeDatabaseOperation } from "../../../shared/utils";
import { FinancialsModel, MongoosePropertyRepo } from ".";
import { FinancialsSchemaType } from "../types";

export interface FinancialsRepo {
    save(data: FinancialsSchemaType, propertyId: string): Promise<void>;
    // update(id: string, data: Partial<FinancialsSchemaType>): Promise<any>;
    // delete(id: string): Promise<void>;
    // findById(id: string): Promise<any>;
    // getAll(): Promise<any[]>;
}

const { NOT_FOUND } = ErrorResponse;

export class MongooseFinancialsRepo implements FinancialsRepo {
    private propertyRepo: MongoosePropertyRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
    }

    async save(data: FinancialsSchemaType, propertyId: string): Promise<void> {
        const propertyDoc = await this.propertyRepo.findById(propertyId);
        if (!propertyDoc) throw new AppError('Property not found', NOT_FOUND.code, NOT_FOUND.statusCode);

        if (propertyDoc.financials) {
            throw new AppError(
                'Property financials already exist. Use update instead of creating new financials.',
                'FINANCIALS_ALREADY_EXIST',
                409
            );
        }

        const newFinancials = new FinancialsModel(data);
        await newFinancials.save();

        await this.propertyRepo.update(propertyId, { financials: newFinancials._id });
    }

    async update(propertyId: string, data: Partial<FinancialsSchemaType>): Promise<any> {
        const propertyDoc = await this.propertyRepo.findById(propertyId);
        if (!propertyDoc) throw new AppError('Property not found', NOT_FOUND.code, NOT_FOUND.statusCode);

        if (!propertyDoc.financials) {
            throw new AppError(
                'Property financials do not exist. Use save to create new financials.',
                'FINANCIALS_NOT_FOUND',
                404
            );
        }

        return executeDatabaseOperation(async () => {
            const updatedDoc = await FinancialsModel.findByIdAndUpdate(propertyDoc.financials, data, { new: true });
            if (!updatedDoc) throw new AppError('Financials not found', NOT_FOUND.code, NOT_FOUND.statusCode);
            return updatedDoc;
        }, 'update');
    }

    // async delete(id: string): Promise<void> {
    //     // Implementation for deleting financial data
    // }

    // async findById(id: string): Promise<any> {
    // }

    // async getAll(): Promise<any[]> {
    //     // Implementation for getting all financial records
    //     return [];
    // }
}