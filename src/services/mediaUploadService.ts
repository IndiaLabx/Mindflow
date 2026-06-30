/**
 * Core service for uploading media to Cloudinary.
 * Used across the app for both user-facing uploads (Reels) and Admin uploads (Flashcards).
 */

export interface CloudinaryUploadOptions {
    file: File;
    resourceType?: 'video' | 'image' | 'auto';
    onProgress?: (progress: number) => void;
}

/**
 * Uploads a file directly to Cloudinary using XMLHttpRequest to track progress.
 * Requires environment variables: VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.
 *
 * @param options - Upload options including the file and progress callback.
 * @returns The secure URL of the uploaded media.
 */
export const uploadMediaToCloudinary = async ({
    file,
    resourceType = 'auto',
    onProgress
}: CloudinaryUploadOptions): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing. Please check your environment variables.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('resource_type', resourceType);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, true);

    const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                onProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                let errorMsg = "Network error during upload";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.error?.message || errorMsg;
                } catch (e) {
                    // Ignore JSON parse error if response is not JSON
                }
                reject(new Error(errorMsg));
            }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload aborted"));
    });

    xhr.send(formData);

    const cloudinaryResponse = await uploadPromise;
    return cloudinaryResponse.secure_url;
};
