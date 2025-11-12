import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';
import { DocumentType } from '../../modules/property/types';


const s3 = new AWS.S3();
const s3ClientForMulter = new S3Client({
    region: process.env.AWS_REGION || '',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const uploadImages = multer({
    storage: multerS3({
        s3: s3ClientForMulter,
        bucket: process.env.AWS_S3_IMAGES_BUCKET_NAME || '',
        key: function (req, file, cb) {
            const filename = `${Date.now().toString()}-${file.originalname}`;
            cb(null, filename);
        },
    }),
});

export const uploadDocs = multer({
    storage: multerS3({
        s3: s3ClientForMulter,
        bucket: process.env.AWS_S3_DOCUMENTS_BUCKET_NAME || '',
        key: (req: any, file: any, cb: any) => {
            const docType = file.fieldname;

            const validDocTypes = new Set(
                Object.values(DocumentType).filter((v) => typeof v === 'string') as string[]
            );

            if (!docType || !validDocTypes.has(String(docType))) {
                return cb(new Error(`Invalid document type: ${docType}. Valid types: ${Array.from(validDocTypes).join(', ')}`), '');
            }

            const filename = `${String(docType)}`;
            cb(null, filename);
        },

    }),
});