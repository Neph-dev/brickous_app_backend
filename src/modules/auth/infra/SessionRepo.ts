import { SessionType } from "../types";
import { SessionModel } from "./SessionModel";
import { executeDatabaseOperation } from "../../../shared/utils";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface SessionRepo {
    createSession(session: Omit<SessionType, "sessionId">): Promise<SessionType>;
    getSessionById(id: string): Promise<SessionType | null>;
    getSessionByUserIdAndDevice(userId: string, deviceId: string): Promise<SessionType | null>;
    getSessionByRefreshToken(refreshToken: string): Promise<SessionType | null>;
    getActiveSessionsByUserId(userId: string): Promise<SessionType[]>;
    getAllSessionsByUserId(userId: string): Promise<SessionType[]>;
    deleteSession(id: string): Promise<boolean>;
    deleteAllUserSessions(userId: string): Promise<boolean>;
}

export class MongooseSessionRepo implements SessionRepo {
    async createSession(session: Omit<SessionType, "sessionId">): Promise<SessionType> {
        return executeDatabaseOperation(async () => {
            // Generate a unique session ID
            const sessionData = {
                ...session,
                sessionId: uuidv4()
            };

            const newSession = new SessionModel(sessionData);
            await newSession.save();
            return newSession.toObject();
        }, 'createSession');
    }

    async getSessionById(id: string): Promise<SessionType | null> {
        return executeDatabaseOperation(async () => {
            return await SessionModel.findOne({ sessionId: id });
        }, 'getSessionById');
    }

    async getSessionByUserIdAndDevice(userId: string, deviceId: string): Promise<SessionType | null> {
        return executeDatabaseOperation(async () => {
            return await SessionModel.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                deviceId: deviceId
            });
        }, 'getSessionByUserIdAndDevice');
    }

    async getSessionByRefreshToken(refreshToken: string): Promise<SessionType | null> {
        return executeDatabaseOperation(async () => {
            return await SessionModel.findOne({ refreshToken });
        }, 'getSessionByRefreshToken');
    }

    async getActiveSessionsByUserId(userId: string): Promise<SessionType[]> {
        return executeDatabaseOperation(async () => {
            // Only return sessions that haven't expired
            const now = new Date().toISOString();
            return await SessionModel.find({
                userId: new mongoose.Types.ObjectId(userId),
                expiresAt: { $gt: now }
            });
        }, 'getActiveSessionsByUserId');
    }

    async getAllSessionsByUserId(userId: string): Promise<SessionType[]> {
        return executeDatabaseOperation(async () => {
            return await SessionModel.find({
                userId: new mongoose.Types.ObjectId(userId)
            });
        }, 'getAllSessionsByUserId');
    }

    async deleteSession(id: string): Promise<boolean> {
        return executeDatabaseOperation(async () => {
            const result = await SessionModel.deleteOne({ sessionId: id });
            return result.deletedCount === 1;
        }, 'deleteSession');
    }

    async deleteAllUserSessions(userId: string): Promise<boolean> {
        return executeDatabaseOperation(async () => {
            const result = await SessionModel.deleteMany({
                userId: new mongoose.Types.ObjectId(userId)
            });
            return result.deletedCount > 0;
        }, 'deleteAllUserSessions');
    }
}
