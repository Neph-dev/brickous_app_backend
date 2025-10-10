import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';


const s3 = new AWS.S3();
const s3ClientForMulter = new S3Client({
    region: process.env.AWS_REGION || '',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const upload = multer({
    storage: multerS3({
        s3: s3ClientForMulter,
        bucket: process.env.AWS_S3_IMAGES_BUCKET_NAME || '',
        key: function (req, file, cb) {
            const filename = `${Date.now().toString()}-${file.originalname}`;
            cb(null, filename);
        },
    }),
});