import mongoose from "mongoose";
import { Address, PropertyStage } from "../../../shared/types";

export interface DetailsType {
    address: Address;
    propertyStage: PropertyStage;
    name: string;
    property: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}