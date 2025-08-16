import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { AppError } from './appError';

/**
 * S3 upload configuration interface
 */
export interface S3UploadOptions {
    contentType?: string;
    acl?: 'private' | 'public-read';
    metadata?: Record<string, string>;
    tags?: Record<string, string>;
    cacheControl?: string;
    expires?: Date;
}

/**
 * S3 upload result interface
 */
export interface S3UploadResult {
    key: string;
    url: string;
    bucket: string;
    etag?: string;
    location: string;
    size?: number;
    uploadedAt: Date;
}

/**
 * S3 file info interface
 */
export interface S3FileInfo {
    originalName: string;
    size: number;
    mimetype: string;
    buffer: Buffer;
}

export interface S3ServiceConfig {
    region?: string;
    bucketName?: string;
}

/**
 * S3 Service Class for handling all S3 operations
 */
class S3Service {
    private s3Client: S3Client;
    private bucketName: string;
    private region: string;

    constructor(config?: S3ServiceConfig) {
        this.region = config?.region || process.env.AWS_REGION || 'eu-west-1';
        this.bucketName = config?.bucketName || process.env.AWS_S3_BUCKET_NAME || 'brickout-assets';

        // Validate required environment variables
        this.validateEnvironmentVariables();

        // Initialize S3 client
        this.s3Client = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        logger.info('S3 Service initialized', {
            region: this.region,
            bucket: this.bucketName
        });
    }

    /**
     * Validates required AWS environment variables
     * @private
     */
    private validateEnvironmentVariables(): void {
        const requiredVars = [
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[ varName ]);

        if (missingVars.length > 0) {
            throw new AppError(
                `Missing required AWS environment variables: ${missingVars.join(', ')}`,
                'MISSING_AWS_CONFIG',
                500
            );
        }
    }

    /**
     * Generates a unique S3 key for file upload
     * @param originalName - Original filename
     * @param folder - Optional folder path
     * @returns Generated S3 key
     * @private
     */
    private generateS3Key(originalName: string, folder?: string): string {
        const timestamp = Date.now();
        const uuid = uuidv4().substring(0, 8);
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const extension = sanitizedName.split('.').pop();
        const nameWithoutExt = sanitizedName.replace(`.${extension}`, '');

        const fileName = `${timestamp}-${uuid}-${nameWithoutExt}.${extension}`;

        return folder ? `${folder}/${fileName}` : fileName;
    }

    /**
     * Uploads a single file to S3
     * @param fileInfo - File information object
     * @param options - Upload options
     * @param folder - Optional folder path
     * @returns Promise<S3UploadResult>
     */
    async uploadFile(
        fileInfo: S3FileInfo,
        options: S3UploadOptions = {},
        folder?: string
    ): Promise<S3UploadResult> {
        try {
            const key = this.generateS3Key(fileInfo.originalName, folder);

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: fileInfo.buffer,
                ContentType: options.contentType || fileInfo.mimetype,
                ACL: options.acl || 'public-read',
                Metadata: options.metadata,
                CacheControl: options.cacheControl || 'max-age=31536000',
                Expires: options.expires,
                Tagging: options.tags ?
                    Object.entries(options.tags)
                        .map(([ k, v ]) => `${k}=${v}`)
                        .join('&') : undefined
            });

            logger.info('Uploading file to S3', {
                bucket: this.bucketName,
                key,
                size: fileInfo.size,
                contentType: fileInfo.mimetype
            });

            const result = await this.s3Client.send(command);

            const uploadResult: S3UploadResult = {
                key,
                bucket: this.bucketName,
                url: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`,
                location: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`,
                etag: result.ETag,
                size: fileInfo.size,
                uploadedAt: new Date()
            };

            logger.info('File uploaded successfully to S3', {
                key,
                url: uploadResult.url,
                etag: result.ETag
            });

            return uploadResult;

        } catch (error) {
            logger.error('Failed to upload file to S3', {
                error: error instanceof Error ? error.message : 'Unknown error',
                fileName: fileInfo.originalName,
                size: fileInfo.size
            });

            throw new AppError(
                'Failed to upload file to S3',
                'S3_UPLOAD_FAILED',
                500
            );
        }
    }

    /**
     * Uploads multiple files to S3
     * @param files - Array of file information objects
     * @param options - Upload options
     * @param folder - Optional folder path
     * @returns Promise<S3UploadResult[]>
     */
    async uploadMultipleFiles(
        files: S3FileInfo[],
        options: S3UploadOptions = {},
        folder?: string
    ): Promise<S3UploadResult[]> {
        try {
            logger.info('Starting batch upload to S3', {
                fileCount: files.length,
                folder: folder || 'root'
            });

            const uploadPromises = files.map(file =>
                this.uploadFile(file, options, folder)
            );

            const results = await Promise.all(uploadPromises);

            logger.info('Batch upload completed successfully', {
                uploadedCount: results.length,
                totalSize: results.reduce((sum, r) => sum + (r.size || 0), 0)
            });

            return results;

        } catch (error) {
            logger.error('Failed to upload multiple files to S3', {
                error: error instanceof Error ? error.message : 'Unknown error',
                fileCount: files.length
            });

            throw new AppError(
                'Failed to upload multiple files to S3',
                'S3_BATCH_UPLOAD_FAILED',
                500
            );
        }
    }

    /**
     * Deletes a file from S3
     * @param key - S3 object key
     * @returns Promise<void>
     */
    async deleteFile(key: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            await this.s3Client.send(command);

            logger.info('File deleted successfully from S3', { key });

        } catch (error) {
            logger.error('Failed to delete file from S3', {
                error: error instanceof Error ? error.message : 'Unknown error',
                key
            });

            throw new AppError(
                'Failed to delete file from S3',
                'S3_DELETE_FAILED',
                500
            );
        }
    }

    /**
     * Generates a pre-signed URL for file download
     * @param key - S3 object key
     * @param expiresIn - URL expiration time in seconds (default: 1 hour)
     * @returns Promise<string>
     */
    async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

            logger.info('Generated signed URL for download', {
                key,
                expiresIn
            });

            return signedUrl;

        } catch (error) {
            logger.error('Failed to generate signed URL', {
                error: error instanceof Error ? error.message : 'Unknown error',
                key
            });

            throw new AppError(
                'Failed to generate download URL',
                'S3_SIGNED_URL_FAILED',
                500
            );
        }
    }

    /**
     * Gets the public URL for a file
     * @param key - S3 object key
     * @returns string
     */
    getPublicUrl(key: string): string {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
}

// Export singleton instance
export const s3Service = new S3Service();

/**
 * High-level utility functions for easy usage
 */

/**
 * Uploads property images to S3
 * @param files - Array of image files
 * @param propertyId - Property ID for folder organization
 * @returns Promise<S3UploadResult[]>
 */
export const uploadPropertyImages = async (
    files: S3FileInfo[],
    propertyId: string
): Promise<S3UploadResult[]> => {
    const folder = `properties/${propertyId}/images`;
    const options: S3UploadOptions = {
        contentType: 'image/*',
        acl: 'public-read',
        cacheControl: 'max-age=2592000', // 30 days
        tags: {
            propertyId,
            type: 'property-image'
        }
    };

    return s3Service.uploadMultipleFiles(files, options, folder);
};

/**
 * Uploads property documents to S3
 * @param files - Array of document files
 * @param propertyId - Property ID for folder organization
 * @returns Promise<S3UploadResult[]>
 */
export const uploadPropertyDocuments = async (
    files: S3FileInfo[],
    propertyId: string
): Promise<S3UploadResult[]> => {
    const folder = `properties/${propertyId}/documents`;
    const options: S3UploadOptions = {
        acl: 'private', // Documents are private
        tags: {
            propertyId,
            type: 'property-document'
        }
    };

    return s3Service.uploadMultipleFiles(files, options, folder);
};

/**
 * Uploads developer assets (logos, etc.)
 * @param files - Array of asset files
 * @param developerId - Developer ID for folder organization
 * @returns Promise<S3UploadResult[]>
 */
export const uploadDeveloperAssets = async (
    files: S3FileInfo[],
    developerId: string
): Promise<S3UploadResult[]> => {
    const folder = `developers/${developerId}/assets`;
    const options: S3UploadOptions = {
        acl: 'public-read',
        tags: {
            developerId,
            type: 'developer-asset'
        }
    };

    return s3Service.uploadMultipleFiles(files, options, folder);
};

/**
 * Converts Express.js file to S3FileInfo
 * @param file - Express.js multer file
 * @returns S3FileInfo
 */
export const convertMulterFileToS3FileInfo = (file: any): S3FileInfo => {
    return {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        buffer: file.buffer
    };
};

// Export the main service and utility functions
export {
    S3Service,
    s3Service as launchToS3,
    s3Service as uploadToS3Bucket
};