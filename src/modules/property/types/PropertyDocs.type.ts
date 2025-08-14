import mongoose from "mongoose";

export interface PropertyDocsType {
    title?: string;
    description: string;
    documentType: DocumentType;
    url: string;
    addedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export enum DocumentType {
    TitleDeed = "TitleDeed",
    ValuationReport = "ValuationReport"
}

export enum DocumentTitle {
    TitleDeed = "Title Deed",
    ValuationReport = "Valuation Report"
}


/**
 * Maps DocumentType enum to its corresponding DocumentTitle
 * @param documentType - The document type enum value
 * @returns The corresponding document title string
 */
export const getDocumentTitle = (documentType: DocumentType): string => {
    const documentTypeToTitleMap: Record<DocumentType, DocumentTitle> = {
        [ DocumentType.TitleDeed ]: DocumentTitle.TitleDeed,
        [ DocumentType.ValuationReport ]: DocumentTitle.ValuationReport
    };

    return documentTypeToTitleMap[ documentType ];
};

/**
 * Creates a complete document info object with type and title
 * @param documentType - The document type enum value
 * @returns Object containing both type and title
 */
export const getDocumentInfo = (documentType: DocumentType) => {
    return {
        type: documentType,
        title: getDocumentTitle(documentType)
    };
};