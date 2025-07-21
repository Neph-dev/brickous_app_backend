import mongoose from "mongoose";
import { InvestmentType } from "../../../shared/types";

export interface PropertyType {
    developer: mongoose.Types.ObjectId;
    investmentType: InvestmentType;
    details?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}