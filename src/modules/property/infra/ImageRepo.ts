import { ErrorResponse } from "../../../constants";
import { AppError } from "../../../shared/utils";
import { PropertyImageModel } from "./ImageModel";
import { MongoosePropertyRepo } from "./PropertyRepo";

export interface ImageRepo {
    save(propertyId: string, imageUrls: string[], thumbnailUrl?: string): Promise<void>;
}

const { NOT_FOUND } = ErrorResponse;

export class MongooseImageRepo implements ImageRepo {
    private propertyRepo: MongoosePropertyRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
    }


    async save(propertyId: string, imageUrls: string[] = [], thumbnailUrl?: string): Promise<void> {
        const propertyDoc = await this.propertyRepo.findById(propertyId);
        if (!propertyDoc) throw new AppError('Property not found', NOT_FOUND.code, NOT_FOUND.statusCode);

        if (propertyDoc.images && propertyDoc.images.imageUrls) {
            propertyDoc.images.imageUrls.push(...imageUrls);
            propertyDoc.images.thumbnailUrl = thumbnailUrl || imageUrls[0];

            await propertyDoc.images.save();
        } else {
            const newImages = new PropertyImageModel({
                imageUrls,
                thumbnailUrl: thumbnailUrl || imageUrls[0]
            });

            await newImages.save();

            propertyDoc.images = newImages._id;
            await propertyDoc.save();
        }
    }
}