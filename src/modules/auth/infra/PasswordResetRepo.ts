import { PasswordResetModel } from './PasswordResetModel';
import { PasswordResetType } from '../types/PasswordResetType';
import { executeDatabaseOperation } from '../../../shared/utils';

export interface PasswordResetRepo {
    create(entry: PasswordResetType): Promise<PasswordResetType>;
    getByResetId(resetId: string): Promise<PasswordResetType | null>;
    getLatestActiveByEmail(email: string): Promise<PasswordResetType | null>;
    markUsed(resetId: string): Promise<void>;
    incrementAttempts(resetId: string): Promise<PasswordResetType | null>;
    updateCode(resetId: string, codeHash: string, expiresAt: string): Promise<void>;
}

export class MongoosePasswordResetRepo implements PasswordResetRepo {
    async create(entry: PasswordResetType): Promise<PasswordResetType> {
        return executeDatabaseOperation(async () => {
            const doc = new PasswordResetModel(entry);
            await doc.save();
            return doc.toObject();
        }, 'passwordReset.create');
    }

    async getByResetId(resetId: string): Promise<PasswordResetType | null> {
        return executeDatabaseOperation(async () => {
            return await PasswordResetModel.findOne({ resetId });
        }, 'passwordReset.getByResetId');
    }

    async getLatestActiveByEmail(email: string): Promise<PasswordResetType | null> {
        return executeDatabaseOperation(async () => {
            return await PasswordResetModel.findOne({ email, used: false }).sort({ createdAt: -1 });
        }, 'passwordReset.getLatestActiveByEmail');
    }

    async markUsed(resetId: string): Promise<void> {
        return executeDatabaseOperation(async () => {
            await PasswordResetModel.updateOne({ resetId }, { used: true });
        }, 'passwordReset.markUsed');
    }

    async incrementAttempts(resetId: string): Promise<PasswordResetType | null> {
        return executeDatabaseOperation(async () => {
            return await PasswordResetModel.findOneAndUpdate(
                { resetId },
                { $inc: { attempts: 1 } },
                { new: true }
            );
        }, 'passwordReset.incrementAttempts');
    }

    async updateCode(resetId: string, codeHash: string, expiresAt: string): Promise<void> {
        return executeDatabaseOperation(async () => {
            await PasswordResetModel.updateOne({ resetId }, { codeHash, expiresAt });
        }, 'passwordReset.updateCode');
    }
}
