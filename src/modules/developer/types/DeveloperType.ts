import mongoose from "mongoose";

export interface DeveloperType {
    users: mongoose.Types.ObjectId[];
    name: string;
    email: string;
    phone: string;
    website?: string;
    logo?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
