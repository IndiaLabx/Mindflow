import { uploadMediaToCloudinary } from '../../../services/mediaUploadService';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, Film, Loader2 } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/context/AuthContext';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { cn } from '../../../utils/cn';
import { KeyboardAwareSurface } from '../../../components/ui/KeyboardAwareSurface';

interface ReelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReelUploadModal: React.FC<ReelUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showToast } = useNotificationStore();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setVideoFile(null);
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
        setVideoPreviewUrl(null);
      }
      setCaption('');
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [isOpen]);

  const handlePickVideo = async () => {
    try {
        // Native App Upload Flow
        if (Capacitor.isNativePlatform()) {
             const result = await Camera.getPhoto({
                 quality: 100,
                 source: CameraSource.Photos,
                 resultType: CameraResultType.Uri,
                 // Note: Capacitor Camera plugin's primary use case is photos.
                 // For robust video selection, we might eventually need @capacitor-community/file-picker.
                 // Using a standard file input fallback for now which works well in Capacitor webviews.
             });
             // Fallback handled below for Web/PWA
        }

        // Web / PWA Fallback using standard input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/mp4,video/quicktime,video/webm';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                if (file.size > 100 * 1024 * 1024) { // 100MB max limit
                    showToast({ title: 'File too large', message: 'Video must be under 100MB', variant: 'error' });
                    return;
                }
                setVideoFile(file);
                const url = URL.createObjectURL(file);
                setVideoPreviewUrl(url);
            }
        };
        input.click();
    } catch (error) {
        console.error("Error picking video:", error);
        showToast({ title: 'Error', message: 'Could not select video', variant: 'error' });
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !user) return;
    setIsUploading(true);
    setUploadProgress(10); // Start progress

    try {
        // --- CLOUDINARY UPLOAD PIPELINE ---
        const secureUrl = await uploadMediaToCloudinary({
            file: videoFile,
            resourceType: 'video',
            onProgress: (percentComplete) => {
                // Map 0-100% XHR progress to 10-90% total progress
                // (leaving 10% for DB insertion)
                setUploadProgress(10 + Math.round(percentComplete * 0.8));
            }
        });

        setUploadProgress(95);

        // --- SUPABASE DATABASE INSERTION ---
        const { error: dbError } = await supabase
            .from('reels')
            .insert({
                user_id: user.id,
                video_url: secureUrl,
                caption: caption.trim() || null
            });

        if (dbError) throw dbError;

        setUploadProgress(100);
        showToast({ title: 'Success', message: 'Reel posted successfully!', variant: 'success' });

        setTimeout(() => {
            onSuccess?.();
            onClose();
        }, 500);

    } catch (error: any) {
        console.error("Upload error:", error);
        showToast({
            title: 'Upload Failed',
            message: error.message || 'Something went wrong while posting your reel.',
            variant: 'error'
        });
        setIsUploading(false);
        setUploadProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 sm:items-center sm:justify-center backdrop-blur-sm p-4">
          <KeyboardAwareSurface
            isModal={true}
            hasGlobalFooter={true}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom)]"
            onClick={(e: any) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Reel</h2>
              {!isUploading && (
                  <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={20} />
                  </button>
              )}
            </div>

            <div className="p-4 flex flex-col gap-4">
                {/* Video Preview or Picker */}
                {!videoPreviewUrl ? (
                    <div
                        onClick={handlePickVideo}
                        className="w-full aspect-[9/16] max-h-[40vh] border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Film size={32} />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-900 dark:text-white">Select Video</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">MP4 or WebM under 100MB</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full aspect-[9/16] max-h-[40vh] bg-black rounded-xl overflow-hidden shadow-inner">
                        <video
                            ref={videoRef}
                            src={videoPreviewUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                        {!isUploading && (
                            <button
                                onClick={handlePickVideo}
                                className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}

                {/* Caption Input */}
                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption... #mindflow"
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-[80px]"
                    disabled={isUploading}
                />

                {/* Progress Bar & Actions */}
                {isUploading ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                            <span>Uploading to Cloud...</span>
                            <span>{uploadProgress < 100 ? uploadProgress + '%' : 'Finalizing...'}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-600 dark:bg-indigo-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                transition={{ ease: "linear" }}
                            />
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleUpload}
                        disabled={!videoFile}
                        className={cn(
                            "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95",
                            videoFile
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        <Upload size={18} />
                        Post Reel
                    </button>
                )}
            </div>
          </KeyboardAwareSurface>
        </div>
      )}
    </AnimatePresence>
  );
};
