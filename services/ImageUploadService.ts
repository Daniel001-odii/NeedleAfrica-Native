import axiosInstance from '../lib/axios';
import { File } from 'expo-file-system';

/**
 * Upload an image to Cloudinary via the API
 * @param uri Local file URI from image picker
 * @param folder Optional folder name (defaults to 'orders')
 * @returns Cloudinary URL or null on failure
 */
export async function uploadImage(uri: string, folder: string = 'orders'): Promise<string | null> {
    try {
        // Use the new File API from expo-file-system
        const file = new File(uri);
        const base64 = await file.base64();

        // Determine mime type from URI
        const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

        // Create data URL
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // Upload to API
        const response = await axiosInstance.post('/upload', {
            image: dataUrl,
            folder,
        });

        if (response.data.success && response.data.data.url) {
            return response.data.data.url;
        }

        console.error('Upload failed:', response.data.message);
        return null;
    } catch (error: any) {
        console.error('Image upload error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Upload multiple images
 * @param uris Array of local file URIs
 * @param folder Optional folder name
 * @returns Array of Cloudinary URLs (null for failed uploads)
 */
export async function uploadMultipleImages(
    uris: string[],
    folder: string = 'orders'
): Promise<(string | null)[]> {
    const uploadPromises = uris.map(uri => uploadImage(uri, folder));
    return Promise.all(uploadPromises);
}

/**
 * Upload order images (fabric and style)
 * Returns an object with the uploaded URLs
 */
export async function uploadOrderImages(
    fabricImageUri?: string | null,
    styleImageUri?: string | null
): Promise<{ fabricImage?: string; styleImage?: string }> {
    const result: { fabricImage?: string; styleImage?: string } = {};

    // Upload in parallel for better performance
    const [fabricResult, styleResult] = await Promise.all([
        fabricImageUri ? uploadImage(fabricImageUri, 'orders/fabric') : null,
        styleImageUri ? uploadImage(styleImageUri, 'orders/style') : null,
    ]);

    if (fabricResult) {
        result.fabricImage = fabricResult;
    }

    if (styleResult) {
        result.styleImage = styleResult;
    }

    return result;
}
