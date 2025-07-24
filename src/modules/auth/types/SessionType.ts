import mongoose from "mongoose";

export interface SessionType {
    sessionId: string;
    userId: mongoose.Types.ObjectId;
    refreshToken: string;
    deviceId: string;
    expiresAt: string;
    createdAt?: Date;
    updatedAt?: Date;
}