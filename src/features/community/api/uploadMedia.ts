import { Upload } from 'tus-js-client';
import { supabase } from '../../../lib/supabase';

// Helper for TUS Uploads directly to Supabase Storage
export const uploadMediaWithProgress = async (
  file: File,
  userId: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const bucketName = file.type.startsWith('video/') ? 'reels_media' : 'post_media';
      const projectId = 'sjcfagpjstbfxuiwhlps';

      const uploadUrl = `https://${projectId}.supabase.co/storage/v1/upload/resumable`;

      const upload = new Upload(file, {
        endpoint: uploadUrl,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-upsert': 'true', // optionally overwrite
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true, // Important if you upload the same file again
        metadata: {
          bucketName: bucketName,
          objectName: fileName,
          contentType: file.type,
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024, // 6 MB chunk size
        onError: function (error: any) {
          console.error('Failed because: ' + error);
          reject(error);
        },
        onProgress: function (bytesUploaded: number, bytesTotal: number) {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          onProgress(parseFloat(percentage));
        },
        onSuccess: function () {
          // Construct the public URL after successful upload
          const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
          resolve(data.publicUrl);
        },
      });

      // Check if there are any previous uploads to continue.
      upload.findPreviousUploads().then(function (previousUploads: any[]) {
        // Found previous uploads so we select the first one.
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        // Start the upload
        upload.start();
      });

    } catch (err) {
      reject(err);
    }
  });
};
