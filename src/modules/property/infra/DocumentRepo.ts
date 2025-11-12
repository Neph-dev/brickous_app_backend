// import mongoose from "mongoose";
import { ErrorResponse } from "../../../constants";
import { AppError, executeDatabaseOperation, logger } from "../../../shared/utils";
import { DocumentType, PropertyDocsType } from "../types";
import { MongoosePropertyRepo, PropertyModel } from "./";
import { PropertyDocsModel } from "./DocumentModel";

export interface DocumentRepo {
    save(data: PropertyDocsType[], propertyId: string): Promise<void>;
    // update(documentType: DocumentType, data: PropertyDocsType): Promise<DocumentType>;
}

const { NOT_FOUND } = ErrorResponse;

export class MongooseDocumentRepo implements DocumentRepo {
    private propertyRepo: MongoosePropertyRepo;

    constructor() {
        this.propertyRepo = new MongoosePropertyRepo();
    }

    async save(data: PropertyDocsType[], propertyId: string): Promise<void> {
        logger.info("Saving documents to propertyId", { propertyId });

        return executeDatabaseOperation(async () => {
            const propertyDoc = await this.propertyRepo.findById(propertyId);
            if (!propertyDoc) throw new AppError('Property not found', NOT_FOUND.code, NOT_FOUND.statusCode);

            const getExistingDocumentByType = (type: DocumentType) => {
                return propertyDoc.documents?.find((doc: PropertyDocsType) => doc.documentType === type);
            };

            if (!propertyDoc.documents) {
                propertyDoc.documents = [];
            }

            for (const doc of data) {
                const existingDoc = getExistingDocumentByType(doc.documentType);

                if (existingDoc) {
                    logger.info("Existing document found, replacing", { documentType: doc.documentType, existingDocumentId: (existingDoc as any)?._id ?? existingDoc });
                    const existingId = (existingDoc as any)?._id ?? existingDoc;

                    if (existingId) {
                        await PropertyDocsModel.findByIdAndDelete(existingId);
                    }

                    const newDoc = new PropertyDocsModel(doc);
                    await newDoc.save();

                    if (Array.isArray(propertyDoc.documents)) {
                        const idx = propertyDoc.documents.findIndex((d: any) => {
                            const dId = d && ((d._id) ? String(d._id) : String(d));
                            return dId === String(existingId);
                        });
                        if (idx !== -1) {
                            propertyDoc.documents[idx] = newDoc._id;
                        } else {
                            propertyDoc.documents.push(newDoc._id);
                        }
                    } else {
                        propertyDoc.documents = [newDoc._id];
                    }

                    logger.info('Replaced existing document with new one', {
                        propertyId,
                        documentType: doc.documentType,
                        newDocumentId: newDoc._id,
                        replacedDocumentId: existingId
                    });
                } else {
                    console.log("No existing document found, adding new document:", doc);
                    const newDocuments = new PropertyDocsModel(doc);
                    await newDocuments.save();

                    propertyDoc.documents.push(newDocuments._id);

                    logger.info('Added new document', {
                        propertyId,
                        documentType: doc.documentType,
                        newDocumentId: newDocuments._id
                    });
                }
            }

            await propertyDoc.save();
            logger.info("Property documents array updated successfully", { propertyId });

        }, 'save');
    }

    // async update(documentType: DocumentType, data: PropertyDocsType): Promise<DocumentType> {

    // }
}