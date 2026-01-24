import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error: string | null;
}

/**
 * Upload an image file to Firebase Storage
 * @param file The image file to upload
 * @param folder The folder path in storage (e.g., 'news', 'blogs')
 * @param onProgress Optional callback for upload progress
 * @returns Promise that resolves to the download URL
 */
export async function uploadImage(
  file: File,
  folder: string = 'images',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = 'Please select a valid image file';
      onProgress?.({ progress: 0, isUploading: false, error });
      reject(new Error(error));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const error = 'Image file size must be less than 5MB';
      onProgress?.({ progress: 0, isUploading: false, error });
      reject(new Error(error));
      return;
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    // Start upload
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({
          progress: Math.round(progress),
          isUploading: true,
          error: null
        });
      },
      (error) => {
        console.error('Upload error:', error);
        onProgress?.({ progress: 0, isUploading: false, error: error.message });
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress?.({ progress: 100, isUploading: false, error: null });
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting download URL:', error);
          onProgress?.({ progress: 0, isUploading: false, error: 'Failed to get download URL' });
          reject(error);
        }
      }
    );
  });
}

/**
 * Delete an image from Firebase Storage
 * @param imageUrl The download URL of the image to delete
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the download URL
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/o/')[1]?.split('?')[0];
    if (!pathSegments) {
      throw new Error('Invalid image URL');
    }
    const decodedPath = decodeURIComponent(pathSegments);
    const imageRef = ref(storage, decodedPath);

    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Validate image file before upload
 * @param file The file to validate
 * @returns Object with validation result
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select a valid image file (JPEG, PNG, GIF, WebP)' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Image file size must be less than 5MB' };
  }

  // Check file size (min 1KB to avoid empty files)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    return { valid: false, error: 'Image file appears to be empty or corrupted' };
  }

  return { valid: true };
}
