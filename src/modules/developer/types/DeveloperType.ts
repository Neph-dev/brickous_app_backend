import mongoose from "mongoose";
import { Address } from "../../../shared/types";

export interface DeveloperType {
    _id: mongoose.Types.ObjectId;
    users: mongoose.Types.ObjectId[];
    name: string;
    email: string;
    phone: string;
    businessAddress: Address;
    website?: string;
    logo?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
