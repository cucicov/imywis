import {supabase} from './supabaseClient.ts';

export const uploadBase64SoundToStorage = async (dataUrl: string, userId: string, fileName: string) => {
  if (!dataUrl.startsWith('data:audio/')) throw new Error('Invalid audio data URL format');
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header.match(/data:(.*?);/)?.[1] || 'audio/mpeg';
  const byteString = atob(base64Data);
  const bytes = new Uint8Array(byteString.length);
  for (let index = 0; index < byteString.length; index++) bytes[index] = byteString.charCodeAt(index);
  const storagePath = `${userId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const {data, error} = await supabase.storage.from('user_audio').upload(storagePath, new Blob([bytes], {type: mimeType}), {contentType: mimeType, upsert: false});
  if (error) throw new Error(`Failed to upload sound: ${error.message}`);
  const {data: {publicUrl}} = supabase.storage.from('user_audio').getPublicUrl(data.path);
  return {publicUrl, path: data.path};
};
