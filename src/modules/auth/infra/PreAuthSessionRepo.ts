import { PreAuthSessionType } from "../types";
import { PreAuthSessionModel } from "./PreAuthSessionModel";
import { executeDatabaseOperation } from "../../../shared/utils";


export interface PreAuthSessionRepo {
    createSession(session: PreAuthSessionType): Promise<PreAuthSessionType>;
    getSessionById(id: string): Promise<PreAuthSessionType | null>;
    getSessionByEmail(email: string): Promise<PreAuthSessionType | null>;
    deleteSession(id: string): Promise<boolean>;
}

export class MongoosePreAuthSessionRepo implements PreAuthSessionRepo {
    async createSession(session: PreAuthSessionType): Promise<PreAuthSessionType> {
        return executeDatabaseOperation(async () => {
            const newSession = new PreAuthSessionModel(session);
            return await newSession.save();
        }, 'createSession');
    }

    async getSessionById(id: string): Promise<PreAuthSessionType | null> {
        return executeDatabaseOperation(async () => {
            return await PreAuthSessionModel.findOne({ preAuthSessionId: id });
        }, 'getSessionById');
    }

    async deleteSession(id: string): Promise<boolean> {
        return executeDatabaseOperation(async () => {
            const result = await PreAuthSessionModel.deleteOne({ preAuthSessionId: id });
            return result.deletedCount === 1;
        }, 'deleteSession');
    }

    async getSessionByEmail(email: string): Promise<PreAuthSessionType | null> {
        return executeDatabaseOperation(async () => {
            return await PreAuthSessionModel.findOne({ email });
        }, 'getSessionByEmail');
    }
}