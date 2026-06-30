import React from 'react';
import { SynonymWord } from '../../../../features/quiz/types';
import { useSynonymProgress } from '../hooks/useSynonymProgress';
import { cn } from '../../../../utils/cn';
import { useState, useEffect } from 'react';
import { useFlashcardStore } from '../../../../features/quiz/stores/useFlashcardStore';
import { FlashcardImage } from '../../../../components/ui/FlashcardImage';
import { useAuth } from '../../../../features/auth/context/AuthContext';
import { uploadMediaToCloudinary } from '../../../../services/mediaUploadService';
import { supabase } from '../../../../lib/supabase';
import { useNotification } from '../../../../hooks/useNotification';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { useAdminDeleteVocab } from '../../hooks/useAdminDeleteVocab';
import { AdminEditVocabModal } from '../../../../features/admin/components/AdminEditVocabModal';
import { Edit } from 'lucide-react';

interface SynonymCardProps {
  data: SynonymWord;
  serialNumber: number;
  isFlipped: boolean;
}

export const SynonymCard: React.FC<SynonymCardProps> = ({ data: initialData, serialNumber, isFlipped }) => {
  const { mutate: deleteVocab, isPending: isDeleting } = useAdminDeleteVocab();
  const [data, setData] = useState<SynonymWord>(initialData);
  const { markMastered, getStatus } = useSynonymProgress();
  const updateCardImage = useFlashcardStore((state) => state.updateCardImage);
  const status = getStatus(data);
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isAdmin = user?.email === 'admin@mindflow.com';
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isAdmin) return;

    setIsUploading(true);
    try {
      const url = await uploadMediaToCloudinary({ file, resourceType: "image" });

      const { error } = await supabase
        .from("synonym")
        .update({ image_url: url })
        .eq("id", data.id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        image_url: url
      }));

      showToast({ title: "Success", message: "Image added successfully", variant: "success" });
      updateCardImage(data.id, "synonyms", url);
    } catch (error: any) {
      console.error("Upload error:", error);
      showToast({ title: "Upload Failed", message: error.message || "Failed to upload image.", variant: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;

    if (!confirm("Are you sure you want to remove this image?")) return;

    setIsUploading(true);
    try {
      const { error } = await supabase
        .from("synonym")
        .update({ image_url: null })
        .eq("id", data.id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        image_url: undefined
      }));

      showToast({ title: "Removed", message: "Image removed successfully", variant: "success" });
      updateCardImage(data.id, "synonyms", undefined);
    } catch (error: any) {
      console.error("Remove error:", error);
      showToast({ title: "Failed", message: error.message || "Failed to remove image.", variant: "error" });
    } finally {
      setIsUploading(false);
    }
  };
  const handleDeleteCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to permanently delete this synonym?')) {
      deleteVocab({ id: data.id, type: 'synonym' });
    }
  };


  return (
    <div className={cn(
      "relative w-full h-full transition-transform duration-500 transform-style-3d",
      isFlipped ? 'rotate-y-180' : ''
    )}>

      {/* FRONT OF CARD */}
      <div className={cn(
        "absolute inset-0 w-full h-full backface-hidden rounded-3xl shadow-xl flex flex-col items-center justify-between p-8 text-center",
        status === 'mastered'
          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      )}>


        {isAdmin && (
          <div className="absolute top-4 right-4 z-50 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 bg-indigo-500/80 hover:bg-indigo-600 text-white rounded-full backdrop-blur-sm transition-colors shadow-lg"
              title="Edit Card"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteCard}
              disabled={isDeleting}
              className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors shadow-lg"
              title="Delete Card"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        )}

        <div className="w-full h-8 flex justify-between items-start">
           {/* Top indicators */}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-4">
              {data.word}
            </h2>

            {data.pos && (
              <span className="text-sm uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full">
                {data.pos}
              </span>
            )}
        </div>

        <div className="w-full flex justify-between items-center text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
            <span className="capitalize">{status === 'mastered' ? 'Easy' : (status as any) === 'tricky' ? 'Hard' : (status as any) === 'clueless' ? 'Hard' : 'Medium'}</span>
            <span>#{serialNumber}</span>
            <span>{(data as any).examName || 'Mixed Set'}</span>
        </div>
      </div>

      {/* BACK OF CARD */}
      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl shadow-xl p-6 md:p-8 flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 z-50">

        <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-baseline gap-3 mb-2">
            <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">{data.word}</h3>
            {data.pos && <span className="text-sm text-gray-400 dark:text-gray-500 italic">{data.pos}</span>}
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-3">{data.meaning}</p>
          <p className="text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/20 inline-block px-3 py-1 rounded-md text-sm">{data.hindiMeaning}</p>
        </div>

        <div className="flex-1 space-y-6">
          {/* Synonyms */}
          {data.synonyms && data.synonyms.length > 0 && (
              <div>
                  <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Synonyms</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.synonyms.map((syn, idx) => (
                      <span key={idx} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {syn.text}
                      </span>
                    ))}
                  </div>
              </div>
          )}

          {/* Antonyms */}
          {data.antonyms && data.antonyms.length > 0 && (
              <div>
                  <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Antonyms</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.antonyms.map((ant, idx) => (
                      <span key={idx} className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {ant.text}
                      </span>
                    ))}
                  </div>
              </div>
          )}

          {/* Confusable Words */}
          {data.confusable_with && data.confusable_with.length > 0 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50">
              <h4 className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-2">⚠️ Confusable With</h4>
              <p className="text-orange-900 dark:text-orange-300 font-medium">
                {data.confusable_with.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Flashcard Image */}
        <div className="mt-4 pb-4 relative group/image">
          {data.image_url ? (
            <div className="relative">
              <FlashcardImage src={data.image_url} alt={data.word} />
              {isAdmin && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center rounded-lg" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={handleImageRemove}
                    disabled={isUploading}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors flex items-center justify-center shadow-lg"
                    title="Remove Image"
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>
          ) : (
            isAdmin && (
              <div className="w-full" onClick={(e) => e.stopPropagation()}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                  id={`synonym-card-image-upload-${data.id}`}
                />
                <label
                  htmlFor={`synonym-card-image-upload-${data.id}`}
                  className={cn(
                    "w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                    isUploading
                      ? "border-blue-300 bg-blue-50 opacity-70 cursor-not-allowed"
                      : "border-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                  )}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-sm font-medium">Admin: Add Image</span>
                    </div>
                  )}
                </label>
              </div>
            )
          )}
        </div>

        {/* Action Buttons on Back */}
        <div className="mt-6 flex justify-center pt-4 border-t border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
          {status !== 'mastered' ? (
            <button
              onClick={() => {
                markMastered(data);
              }}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 w-full justify-center"
            >
              ✓ Mark as Mastered
            </button>
          ) : (
            <div className="text-green-600 dark:text-green-400 font-bold flex items-center justify-center gap-2 py-3 w-full border-2 border-green-200 dark:border-green-800 rounded-full">
              🟢 Mastered
            </div>
          )}
        </div>
      </div>


      <AdminEditVocabModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        type="synonym"
        cardData={data}
      />

      <style>{`
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
</div>
  );
};
