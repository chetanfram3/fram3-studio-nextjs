import logger from "@/utils/logger";
import { auth } from '@/lib/firebase';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface UploadResponse {
    success: boolean;
    url?: string;
    path?: string;
    error?: string;
}

export interface UploadProgress {
    progress: number;
    status: 'uploading' | 'success' | 'error';
    url?: string;
    path?: string;
    error?: string;
}

export interface UploadOptions {
    extractionNotes?: string;
    onProgress?: (progress: UploadProgress) => void;
    sessionId?: string;
}

interface FileUploadData {
    bucketName: string;
    originalName: string;
    contentType: string;
    signedUrl: string;
    path: string;
    publicUrl: string;
}

/**
 * Get authentication token for API requests
 * @returns Promise with the auth token
 */
async function getAuthToken(): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
        throw new Error('Authentication required');
    }
    return token;
}

/**
 * Get the current user ID
 * @returns The authenticated user ID
 */
function getCurrentUserId(): string {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        throw new Error('User not authenticated');
    }
    return userId;
}

/**
 * Get signed URLs for direct upload to Google Cloud Storage
 * @param files Array of files to upload
 * @param sessionId Optional session ID for grouping files
 * @returns Promise with session data including signed URLs
 */
export const getSignedUploadUrls = async (
    files: File[],
    sessionId?: string
): Promise<{ sessionId: string; files: FileUploadData[] }> => {
    try {
        // Get auth token and user ID
        const token = await getAuthToken();
        const userId = getCurrentUserId();

        // Prepare file metadata for the request
        const filesMetadata = files.map(file => ({
            name: file.name,
            contentType: file.type
        }));

        // Request signed URLs from the backend
        const response = await fetch(`${API_BASE_URL}/scripts/generate-upload-urls`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                files: filesMetadata,
                sessionId
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to get signed URLs: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            sessionId: data.sessionId,
            files: data.files
        };
    } catch (error) {
        logger.error('Error getting signed upload URLs:', error);
        throw error;
    }
};

/**
 * Upload a file directly to Google Cloud Storage using a signed URL
 * @param file File to upload
 * @param signedUrl The signed URL for uploading
 * @param onProgress Optional progress callback
 * @returns Promise with upload success status
 */
export const uploadFileToGCS = async (
    file: File,
    signedUrl: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress?.({
                    progress,
                    status: 'uploading'
                });
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress?.({
                    progress: 100,
                    status: 'success'
                });
                resolve(true);
            } else {
                const errorMsg = `Upload failed with status ${xhr.status}: ${xhr.statusText}`;
                logger.error(errorMsg);
                onProgress?.({
                    progress: 0,
                    status: 'error',
                    error: errorMsg
                });
                reject(new Error(errorMsg));
            }
        });

        xhr.addEventListener('error', (event) => {
            const errorMsg = 'Network error during upload';
            logger.error(errorMsg, event);
            onProgress?.({
                progress: 0,
                status: 'error',
                error: errorMsg
            });
            reject(new Error(errorMsg));
        });

        xhr.addEventListener('abort', () => {
            const errorMsg = 'Upload was aborted';
            onProgress?.({
                progress: 0,
                status: 'error',
                error: errorMsg
            });
            reject(new Error(errorMsg));
        });

        // Open the request with the signed URL
        xhr.open('PUT', signedUrl);

        // IMPORTANT: Set content type header to match what's expected
        xhr.setRequestHeader('Content-Type', file.type);

        // Send the file as binary data
        xhr.send(file);
    });
};

/**
 * Uploads multiple files directly to Google Cloud Storage
 * @param files Files to upload
 * @param options Upload options including session management
 * @returns Promise with the upload response
 */
export const uploadFilesToGCS = async (
    files: File[],
    options: UploadOptions = {}
): Promise<{ sessionId: string; files: { originalName: string; success: boolean; path?: string; url?: string; error?: string }[] }> => {
    const { sessionId, onProgress } = options;

    try {
        // Step 1: Get signed URLs for all files
        const urlData = await getSignedUploadUrls(files, sessionId);
        const results = [];

        // Step 2: Upload each file to its signed URL
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileData = urlData.files[i];

            try {
                onProgress?.({
                    progress: 0,
                    status: 'uploading'
                });

                await uploadFileToGCS(file, fileData.signedUrl, (progress) => {
                    onProgress?.({
                        ...progress,
                        path: `gs://${fileData.bucketName}/${fileData.path}`
                    });
                });

                // Successfully uploaded
                results.push({
                    originalName: file.name,
                    success: true,
                    path: `gs://${fileData.bucketName}/${fileData.path}`,
                });
            } catch (error) {
                logger.error(`Error uploading file ${file.name}:`, error);

                results.push({
                    originalName: file.name,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown upload error'
                });
            }
        }

        return {
            sessionId: urlData.sessionId,
            files: results
        };
    } catch (error) {
        logger.error("Error in GCS upload process:", error);
        throw error;
    }
};

/**
 * Cleanup uploaded files from Google Cloud Storage
 * @param sessionId Session ID for the files to clean up
 * @returns Promise with cleanup status
 */
export const cleanupUploadedFiles = async (
    sessionId: string
): Promise<boolean> => {
    try {
        // Get auth token and user ID
        const token = await getAuthToken();
        const userId = getCurrentUserId();

        const response = await fetch(`${API_BASE_URL}/scripts/cleanup-uploads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                sessionId
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to cleanup files: ${response.status} ${response.statusText}`);
        }

        return true;
    } catch (error) {
        logger.error('Error cleaning up uploaded files:', error);
        return false;
    }
};

/**
 * Uploads a file to Google Cloud Storage
 * @param file File to upload
 * @param options Upload options including progress tracking
 * @returns Promise with the upload response
 */
export const uploadFile = async (
    file: File,
    options: UploadOptions = {}
): Promise<UploadResponse> => {
    try {
        // Use the GCS direct upload
        const result = await uploadFilesToGCS([file], options);
        const fileResult = result.files[0];

        return {
            success: fileResult.success,
            url: fileResult.url,
            path: fileResult.path,
            error: fileResult.error
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
        logger.error("File upload error:", errorMessage);

        return {
            success: false,
            error: errorMessage
        };
    }
};

/**
 * Upload multiple files to Google Cloud Storage
 * @param files Array of files to upload
 * @param options Upload options
 * @returns Promise with array of upload responses
 */
export const uploadMultipleFiles = async (
    files: File[],
    options: UploadOptions = {}
): Promise<UploadResponse[]> => {
    try {
        const result = await uploadFilesToGCS(files, options);

        return result.files.map(file => ({
            success: file.success,
            url: file.url,
            path: file.path,
            error: file.error
        }));
    } catch (error) {
        logger.error("Multiple file upload error:", error);

        return files.map(() => ({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown upload error'
        }));
    }
};