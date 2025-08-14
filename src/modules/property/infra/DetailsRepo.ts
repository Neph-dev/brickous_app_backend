import { ErrorResponse } from "../../../constants";
import { AppError, executeDatabaseOperation } from "../../../shared/utils";
import { DetailsType } from "../types";
import { DetailsModel, MongoosePropertyRepo } from "./";

export interface PropertyDetailsRepo {
    save(data: DetailsType, propertyId: string): Promise<void>;
    update(id: string, data: DetailsType): Promise<DetailsType>;
}

const { NOT_FOUND } = ErrorResponse;

export class MongoosePropertyDetailsRepo implements PropertyDetailsRepo {
    private propertyRepo: MongoosePropertyRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
    }

    async save(data: DetailsType, propertyId: string): Promise<void> {
        return executeDatabaseOperation(async () => {
            const propertyDoc = await this.propertyRepo.findById(propertyId);
            if (!propertyDoc) throw new AppError('Property not found', NOT_FOUND.code, NOT_FOUND.statusCode);

            if (propertyDoc.details) {
                throw new AppError(
                    'Property details already exist. Use update instead of creating new details.',
                    'DETAILS_ALREADY_EXIST',
                    409
                );
            }

            const detailsDoc = new DetailsModel(data);
            await detailsDoc.save();

            await this.propertyRepo.update(propertyId, { details: detailsDoc._id });
        }, 'save');
    }

    async update(id: string, data: DetailsType): Promise<DetailsType> {
        return executeDatabaseOperation(async () => {
            const updatedDoc = await DetailsModel.findByIdAndUpdate(id, data, { new: true });
            if (!updatedDoc) throw new AppError('Detail not found', NOT_FOUND.code, NOT_FOUND.statusCode);
            return updatedDoc;
        }, 'update');
    }
}