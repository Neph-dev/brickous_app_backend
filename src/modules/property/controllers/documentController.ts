import { Request, Response } from 'express';

import { errorHandler } from '../../../shared/utils';
import { DocumentType, getDocumentTitle, PropertyDocsType } from '../types';
import { MongooseDocumentRepo } from '../infra/DocumentRepo';
import { ObjectId } from 'mongodb';

const AWS_S3_BUCKET_DOCUMENTS_BASE_URL = process.env.AWS_S3_BUCKET_DOCUMENTS_BASE_URL || '';

export class DocumentController {
    private documentRepo: MongooseDocumentRepo;

    constructor() {
        this.documentRepo = new MongooseDocumentRepo();
    }

    async addPropertyDocuments(req: Request, res: Response) {
        try {
            const { propertyId } = req.params;

            if (!propertyId) {
                return res.status(400).json({
                    status: 400,
                    message: 'propertyId is required',
                    code: 'MISSING_PROPERTY_ID'
                });
            }

            let allFiles: any[] = [];

            if (req.files) {
                if (Array.isArray(req.files)) {
                    allFiles = req.files;
                } else {
                    allFiles = Object.values(req.files).flat();
                }
            }

            if (allFiles.length === 0) {
                return res.status(400).json({
                    status: 400,
                    message: 'At least one document file is required',
                    code: 'MISSING_DOCUMENT_FILES'
                });
            }

            const userId: string = req.user?.sub || '';

            const documents: PropertyDocsType[] = allFiles.map((file: any) => ({
                title: `${getDocumentTitle(file.key)}-${Date.now().toString()}-${userId}`,
                description: `${file.key} description`,
                documentType: file.key as DocumentType,
                url: `${AWS_S3_BUCKET_DOCUMENTS_BASE_URL}/${file.key}`,
                addedBy: userId as unknown as ObjectId,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));

            await this.documentRepo.save(documents, propertyId);

            return res.status(201).json({
                status: 201,
                message: 'Documents added successfully',
            });
        } catch (error: any) {
            return errorHandler(error, res);
        }
    }
}