import mongoose from "mongoose";
import { InvestmentType, PropertyStatus } from "../../../shared/types";

export interface PropertySchemaType {
    developer: mongoose.Types.ObjectId;
    investmentType: InvestmentType;
    details?: mongoose.Types.ObjectId;
    documents?: mongoose.Types.ObjectId[];
    images?: mongoose.Types.ObjectId;
    status: PropertyStatus;
    createdAt?: Date;
    updatedAt?: Date;
}