// import mongoose from "mongoose";
import { ErrorResponse } from "../../../constants";
import { AppError, executeDatabaseOperation } from "../../../shared/utils";
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
        console.log("Saving documents to propertyId:", propertyId);
        console.log("Documents data:", data);

        return executeDatabaseOperation(async () => {
            const propertyDoc = await this.propertyRepo.findById(propertyId);
            if (!propertyDoc) throw new AppError('Property not found', NOT_FOUND.code, NOT_FOUND.statusCode);

            const getExistingDocumentByType = (type: DocumentType,) => {
                return propertyDoc.documents?.find((doc: PropertyDocsType) => doc.documentType === type);
            };

            data.forEach(async (doc) => {
                const existingDoc = getExistingDocumentByType(doc.documentType);
                if (existingDoc) {
                    console.log("Existing document found, replacing:", existingDoc);
                    const existingId = (existingDoc as any)?._id ?? existingDoc;

                    if (existingId) {
                        await PropertyDocsModel.findByIdAndDelete(existingId);
                    }

                    // Create and save the new document
                    const newDoc = new PropertyDocsModel(doc);
                    await newDoc.save();

                    // // Replace the reference in the property's documents array
                    // if (Array.isArray(propertyDoc.documents)) {
                    //     const idx = propertyDoc.documents.findIndex((d: any) => {
                    //         const dId = d && ((d._id) ? String(d._id) : String(d));
                    //         return dId === String(existingId);
                    //     });
                    //     if (idx !== -1) {
                    //         propertyDoc.documents[idx] = newDoc._id;
                    //     } else {
                    //         // fallback: push new doc id
                    //         propertyDoc.documents.push(newDoc._id);
                    //     }
                    // } else {
                    //     propertyDoc.documents = [newDoc._id];
                    // }

                    // await propertyDoc.save();
                    // console.log("Replaced existing document with new one:", newDoc);
                } else {
                    console.log("No existing document found, adding new document:", doc);
                    propertyDoc.documents = data;
                    const newDocuments = new PropertyDocsModel(doc);

                    await newDocuments.save();

                    propertyDoc.documents.push(newDocuments._id);

                    await propertyDoc.save();
                }
            });
        }, 'save');
    }

    // async update(documentType: DocumentType, data: PropertyDocsType): Promise<DocumentType> {

    // }
}