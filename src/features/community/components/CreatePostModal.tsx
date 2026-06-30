import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Video, Film, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { createPost, createReel } from '../api/communityApi';
import { uploadMediaWithProgress } from '../api/uploadMedia';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { useQueryClient } from '@tanstack/react-query';
import { useCreatePost } from '../hooks/useCreatePost';
import { Post } from '../api/communityApi';
import { KeyboardAwareSurface } from '../../../components/ui/KeyboardAwareSurface';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedType: 'posts' | 'reels';
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, feedType }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useNotificationStore();

  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [postType, setPostType] = useState<'text' | 'image' | 'reel'>('text');

  const [isUploading, setIsUploading] = useState(false);
  const { createPost, isPending, uploadProgress, resetProgress } = useCreatePost(feedType);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const reelInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setContent('');
    setFile(null);
    setPreviewUrl(null);
    setPostType('text');
    setIsUploading(false);
    resetProgress();
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (reelInputRef.current) reelInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isUploading) return;
    resetState();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, selectedType: 'image' | 'reel') => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate size and type
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (selectedType === 'image' && !isImage) {
      showToast({ title: 'Invalid File', message: 'Please select a valid image file.', variant: 'error' });
      return;
    }
    if (selectedType === 'reel' && !isVideo) {
      showToast({ title: 'Invalid File', message: 'Please select a valid video file.', variant: 'error' });
      return;
    }

    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (isImage && fileSizeMB > 5) {
      showToast({ title: 'File too large', message: 'Images must be under 5MB.', variant: 'error' });
      return;
    }
    if (isVideo && fileSizeMB > 15) {
      showToast({ title: 'File too large', message: 'Videos/Reels must be under 15MB.', variant: 'error' });
      return;
    }

    setFile(selectedFile);
    setPostType(selectedType);

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const triggerFileInput = (type: 'image' | 'reel') => {
    setPostType(type);
    if (type === 'image' && imageInputRef.current) {
      imageInputRef.current.value = '';
      imageInputRef.current.click();
    } else if (type === 'reel' && reelInputRef.current) {
      reelInputRef.current.value = '';
      reelInputRef.current.click();
    }
  };


  const handleSubmit = async () => {
    if (!content.trim() && !file) {
      showToast({ title: 'Wait', message: 'Post cannot be empty', variant: 'error' });
      return;
    }

    if (!user) {
        showToast({ title: 'Error', message: 'You must be logged in to post.', variant: 'error' });
        return;
    }

    setIsUploading(true);
    try {
        await createPost({
            userId: user.id,
            content,
            file,
            postType
        });
        handleClose();
    } catch (err) {
        // Error handled in the hook
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={handleClose}
          />
          <KeyboardAwareSurface
            isModal={true}
            hasGlobalFooter={true}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-3xl shadow-2xl p-6 max-h-[85vh] custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create {feedType === 'reels' ? 'Reel' : 'Post'}</h2>
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 custom-scrollbar">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={feedType === 'reels' ? "Write a caption for your reel..." : "What's on your mind?"}
                disabled={isUploading}
                className="w-full h-32 p-4 bg-gray-50 rounded-2xl resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-gray-900 text-lg disabled:opacity-70"
              />

              {previewUrl && (
                <div className="relative mt-4 rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center min-h-[150px]">
                  {postType === 'image' ? (
                    <img src={previewUrl} alt="Preview" className="max-h-[300px] w-auto object-contain rounded-xl" />
                  ) : (
                    <video src={previewUrl} className="max-h-[300px] w-auto object-contain rounded-xl" controls />
                  )}
                  {!isUploading && (
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                        setPostType('text');
                        if (imageInputRef.current) imageInputRef.current.value = '';
                        if (reelInputRef.current) reelInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  className="hidden text-base"
                  onChange={(e) => handleFileSelect(e, 'image')}
                />
                <input
                  type="file"
                  accept="video/*"
                  ref={reelInputRef}
                  className="hidden text-base"
                  onChange={(e) => handleFileSelect(e, 'reel')}
                />

                <button
                  onClick={() => triggerFileInput('image')}
                  disabled={isUploading || !!file}
                  className="p-3 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ImageIcon size={20} />
                </button>
<button
                  onClick={() => triggerFileInput('reel')}
                  disabled={isUploading || !!file}
                  className="p-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Film size={20} />
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isUploading || (!content.trim() && !file)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{uploadProgress > 0 ? (uploadProgress < 100 ? 'Uploading ' + uploadProgress + '%' : 'Finalizing...') : 'Processing...'}</span>
                  </>
                ) : (
                  'Publish'
                )}
              </button>
            </div>

            {/* Progress Bar */}
            {isUploading && uploadProgress > 0 && (
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
            )}
          </KeyboardAwareSurface>
        </>
      )}
    </AnimatePresence>
  );
};
