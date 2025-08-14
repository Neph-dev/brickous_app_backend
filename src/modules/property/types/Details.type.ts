import mongoose from "mongoose";
import { Address, PropertyScope, PropertyStage, PropertyType } from "../../../shared/types";

export interface DetailsType {
    address: Address;
    propertyStage: PropertyStage;
    name: string;
    propertyType: PropertyType;
    propertyScope: PropertyScope;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}