import { PropertyDocsType } from "../types";

export const validatePropertyDocs = (data: PropertyDocsType) => {
    const errors: any = {};

    if (!data.documentType || !Object.values(DocumentType).includes(data.documentType)) {
        errors.documentType = 'Document type is required and must be a valid type';
    }

    if (!data.description) {
        errors.description = 'Description is required';
    }

    if (!data.url) {
        errors.url = 'File is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
