import mongoose from "mongoose";
import { Address, PropertyScope, PropertyStage, PropertyType } from "../../../shared/types";

export interface DetailsType {
    address: Address;
    propertyStage: PropertyStage;
    name: string;
    property: mongoose.Types.ObjectId;
    propertyType: PropertyType;
    propertyScope: PropertyScope;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}