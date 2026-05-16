import {supabase} from './supabaseClient.ts';

type UploadResult = {
  publicUrl: string;
  path: string;
};

/**
 * Uploads a Base64 encoded image to Supabase Storage (user_images bucket)
 * @param dataUrl - Base64 data URL (e.g., "data:image/png;base64,...")
 * @param userId - User ID for organizing uploads
 * @param fileName - Original file name
 * @returns Public URL and storage path
 */
export const uploadBase64ImageToStorage = async (
  dataUrl: string,
  userId: string,
  fileName: string
): Promise<UploadResult> => {
  if (!dataUrl.startsWith('data:image/')) {
    throw new Error('Invalid data URL format');
  }

  // Extract MIME type and base64 data
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/png';

  // Convert base64 to Blob
  const byteString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([uint8Array], {type: mimeType});

  // Generate unique path: user_id/timestamp-filename
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${timestamp}-${sanitizedFileName}`;

  // Upload to Supabase Storage bucket 'user_images'
  const {data, error} = await supabase.storage
    .from('user_images')
    .upload(storagePath, blob, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const {data: {publicUrl}} = supabase.storage
    .from('user_images')
    .getPublicUrl(data.path);

  return {
    publicUrl,
    path: data.path,
  };
};
