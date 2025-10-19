// src/services/firebaseUploadService.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '@/lib/firebase';
import logger from '@/utils/logger';

export interface FirebaseUploadProgress {
    progress: number;
    status: 'uploading' | 'success' | 'error';
    url?: string;
    error?: string;
}

export interface FirebaseUploadResult {
    success: boolean;
    url?: string;
    path?: string;
    error?: string;
}

// Allowed file types for temp reference uploads
const ALLOWED_FILE_TYPES = [
    'image/',                                           // All images
    'application/pdf',                                  // PDF
    'application/msword',                               // DOC
    'application/vnd.openxmlformats-officedocument',   // DOCX, XLSX, PPTX
    'application/vnd.ms-',                             // XLS, PPT (legacy)
    'text/plain',                                       // TXT
    'application/json',                                 // JSON
];

/**
 * Upload file directly to Firebase Storage (temp location)
 * Much faster than backend API for reference files
 * 
 * Supports: Images, PDFs, DOC, DOCX, XLS, XLSX, TXT, JSON
 * 
 * @param file - File to upload
 * @param onProgress - Optional progress callback
 * @returns Upload result with download URL
 * 
 * @example
 * const result = await uploadTempArtifact(file, (progress) => {
 *   console.log(`Upload progress: ${progress.progress}%`);
 * });
 * 
 * if (result.success) {
 *   console.log('File URL:', result.url);
 * }
 */
export async function uploadTempArtifact(
    file: File,
    onProgress?: (progress: FirebaseUploadProgress) => void
): Promise<FirebaseUploadResult> {
    try {
        // Get current user
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated to upload files');
        }

        // Validate file type
        const isAllowedType = ALLOWED_FILE_TYPES.some(type =>
            file.type.startsWith(type)
        );

        if (!isAllowedType) {
            throw new Error(
                'File type not allowed. Supported: Images, PDF, DOC, DOCX, XLS, XLSX, TXT, JSON'
            );
        }

        // Validate file size (10MB limit)
        const maxSizeMB = 10;
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            throw new Error(`File must be less than ${maxSizeMB}MB`);
        }

        // Create unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const sanitizedExtension = extension.replace(/[^a-z0-9]/gi, '');
        const filename = `${timestamp}-${random}.${sanitizedExtension}`;

        // Create storage reference
        // Path: temp-reference/{userId}/{filename}
        const storagePath = `temp-reference/${user.uid}/${filename}`;
        const storageRef = ref(storage, storagePath);

        logger.debug('Starting Firebase upload:', {
            filename,
            size: file.size,
            type: file.type
        });

        // Report initial progress
        onProgress?.({
            progress: 0,
            status: 'uploading',
        });

        // Use simple uploadBytes instead of resumable upload
        // This avoids 412 errors caused by resumable upload protocol
        const uploadResult = await uploadBytes(storageRef, file, {
            contentType: file.type || 'application/octet-stream',
        });

        logger.debug('Upload complete, getting download URL...');

        // Simulate progress for better UX
        onProgress?.({
            progress: 90,
            status: 'uploading',
        });

        // Get download URL
        const downloadURL = await getDownloadURL(uploadResult.ref);

        logger.debug('Upload complete:', { url: downloadURL, path: storagePath });

        onProgress?.({
            progress: 100,
            status: 'success',
            url: downloadURL,
        });

        return {
            success: true,
            url: downloadURL,
            path: storagePath,
        };
    } catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown upload error';

        logger.error('Upload error:', error);

        onProgress?.({
            progress: 0,
            status: 'error',
            error: errorMessage,
        });

        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Upload multiple temp files sequentially
 * 
 * @param files - Array of files
 * @param onProgress - Progress callback with file index
 * @returns Array of upload results
 */
export async function uploadMultipleTempArtifacts(
    files: File[],
    onProgress?: (index: number, progress: FirebaseUploadProgress) => void
): Promise<FirebaseUploadResult[]> {
    const results: FirebaseUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
        const result = await uploadTempArtifact(files[i], (progress) => {
            onProgress?.(i, progress);
        });
        results.push(result);
    }

    return results;
}

/**
 * Delete a temp file from Firebase Storage
 * Call this after successful processing to cleanup
 * 
 * @param path - Storage path (from upload result)
 * @returns true if deleted successfully
 */
export async function deleteTempArtifact(path: string): Promise<boolean> {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        logger.debug('Temp artifact deleted:', path);
        return true;
    } catch (error) {
        logger.error('Error deleting temp artifact:', error);
        return false;
    }
}

/**
 * Cleanup multiple temp files
 * Call this after processing completes or fails
 * 
 * @param paths - Array of storage paths
 */
export async function cleanupTempArtifacts(paths: string[]): Promise<void> {
    const deletePromises = paths.map(path => deleteTempArtifact(path));
    await Promise.allSettled(deletePromises); // Continue even if some fail
    logger.debug(`Cleaned up ${paths.length} temp artifacts`);
}

// Legacy aliases for backward compatibility (if needed)
export const uploadTempImage = uploadTempArtifact;
export const uploadMultipleTempImages = uploadMultipleTempArtifacts;
export const deleteTempImage = deleteTempArtifact;
export const cleanupTempImages = cleanupTempArtifacts;