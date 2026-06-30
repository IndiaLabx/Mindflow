import React, { useState } from 'react';
import { cn } from '../../../../utils/cn';
import { Idiom } from '../../../../types/models';
import { BookOpen, Lightbulb, Quote, RotateCw, CheckCircle2, Circle, ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { useIdiomProgress } from '../../idioms/hooks/useIdiomProgress';
import { FlashcardImage } from '../../../../components/ui/FlashcardImage';
import { useFlashcardStore } from '../../../../features/quiz/stores/useFlashcardStore';
import { useAuth } from '../../../../features/auth/context/AuthContext';
import { uploadMediaToCloudinary } from '../../../../services/mediaUploadService';
import { supabase } from '../../../../lib/supabase';
import { useNotification } from '../../../../hooks/useNotification';
import { useAdminDeleteVocab } from '../../hooks/useAdminDeleteVocab';
import { AdminEditVocabModal } from '../../../../features/admin/components/AdminEditVocabModal';
import { Edit } from 'lucide-react';

/**
 * Props for the Flashcard component.
 */
interface IdiomCardProps {
  /** The idiom data to display on the card. */
  idiom: Idiom;
  /** The serial number of the card in the current session (1-based). */
  serialNumber: number;
  /** Whether the card is currently showing its back side. */
  isFlipped: boolean;
}

/**
 * A 3D flipping flashcard component.
 *
 * Displays the idiom phrase on the front and detailed meanings/usage on the back.
 * Uses CSS 3D transforms for the flip animation.
 *
 * @param {IdiomCardProps} props - The component props.
 * @returns {JSX.Element} The rendered Flashcard.
 */
export const IdiomCard: React.FC<IdiomCardProps> = ({ idiom: initialIdiom, serialNumber, isFlipped }) => {
  const { mutate: deleteVocab, isPending: isDeleting } = useAdminDeleteVocab();
  const { getKnownStatus, toggleKnownStatus } = useIdiomProgress();
  const updateCardImage = useFlashcardStore((state) => state.updateCardImage);
  const [idiom, setIdiom] = useState<Idiom>(initialIdiom);
  const isKnown = getKnownStatus(idiom);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { user } = useAuth();
  const { showToast } = useNotification();
  const isAdmin = user?.email === 'admin@mindflow.com';
  const [isUploading, setIsUploading] = useState(false);

  // Sync initial state if prop changes
  React.useEffect(() => {
    setIdiom(initialIdiom);
  }, [initialIdiom]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast({ title: 'Error', message: 'Image must be under 5MB', variant: 'error' });
      return;
    }

    setIsUploading(true);

    try {
      const url = await uploadMediaToCloudinary({
        file,
        resourceType: 'image'
      });

      const { error } = await supabase
        .from('idiom')
        .update({ image_url: url })
        .eq('id', idiom.id);

      if (error) throw error;

      // Optimistically update local state
      setIdiom(prev => ({
        ...prev,
        content: {
          ...prev.content,
          image_url: url
        }
      }));

      showToast({ title: 'Success', message: 'Image uploaded and attached!', variant: 'success' });
      updateCardImage(idiom.id, "idioms", url);
    } catch (error: any) {
      console.error("Upload error:", error);
      showToast({ title: 'Upload Failed', message: error.message || 'Failed to upload image.', variant: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;

    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('idiom')
        .update({ image_url: null })
        .eq('id', idiom.id);

      if (error) throw error;

      // Optimistically update local state
      setIdiom(prev => ({
        ...prev,
        content: {
          ...prev.content,
          image_url: undefined
        }
      }));

      showToast({ title: 'Removed', message: 'Image removed successfully', variant: 'success' });
      updateCardImage(idiom.id, "idioms", undefined);
    } catch (error: any) {
      console.error("Remove error:", error);
      showToast({ title: 'Failed', message: error.message || 'Failed to remove image.', variant: 'error' });
    } finally {
      setIsUploading(false);
    }
  };
  const handleDeleteCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to permanently delete this idiom?')) {
      deleteVocab({ id: idiom.id, type: 'idiom' });
    }
  };


  return (
    <div
      className="relative w-full h-full perspective-1000 cursor-pointer group"
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 transform-style-3d shadow-xl rounded-3xl",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        {/* --- FRONT FACE --- */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">

          {/* Header Decoration */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-orange-500"></div>

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

            <div className="absolute top-4 left-4">
              {isKnown && (
                <div className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-md text-xs shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Read
                </div>
              )}
            </div>

          <div className="absolute top-4 right-4 text-amber-100">
            <RotateCw className="w-6 h-6" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-amber-50/30">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2 shadow-sm">
              <Quote className="w-8 h-8 fill-current" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white dark:text-white leading-tight drop-shadow-sm font-serif">
              {idiom.content.phrase}
            </h2>

            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-4">
              Tap to Reveal Meaning
            </p>
          </div>

          {/* Footer Tags */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{idiom.properties?.difficulty}</span>
            <span>#{serialNumber}</span>
            <span>{idiom.sourceInfo.pdfName} | {idiom.sourceInfo.examYear}</span>
          </div>
        </div>

        {/* --- BACK FACE --- */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
          {/* Header */}
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-amber-900 truncate max-w-[80%] font-serif text-lg">{idiom.content.phrase}</h3>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleKnownStatus(idiom);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95",
                  isKnown
                    ? "bg-amber-600 text-white hover:bg-amber-700 ring-2 ring-amber-200"
                    : "bg-white text-gray-500 hover:text-amber-600 hover:bg-amber-50 border border-gray-200"
                )}
              >
                {isKnown ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                {isKnown ? 'Known' : 'Mark as Known'}
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">

            {/* Meanings */}
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 border-amber-500 shadow-sm ring-1 ring-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meaning (English)</p>
                <p className="text-gray-800 dark:text-gray-100 font-medium leading-relaxed text-lg">{idiom.content.meanings.english}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 border-orange-400 shadow-sm ring-1 ring-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meaning (Hindi)</p>
                <p className="text-gray-800 dark:text-gray-100 font-hindi font-medium text-lg">{idiom.content.meanings.hindi}</p>
              </div>
            </div>

            {/* Usage */}
            <div className="relative pl-4 italic text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed">
              <span className="absolute top-0 left-0 text-4xl text-gray-200 font-serif">"</span>
              {idiom.content.usage}
            </div>

            {/* Extras */}
            {(idiom.content.extras.mnemonic || idiom.content.extras.origin) && (
              <div className="bg-indigo-50 rounded-xl p-4 space-y-3 border border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                  <Lightbulb className="w-4 h-4" />
                  <span>Memory Aids</span>
                </div>

                {idiom.content.extras.mnemonic && (
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase">Mnemonic: </span>
                    <span className="text-indigo-900 text-sm">{idiom.content.extras.mnemonic}</span>
                  </div>
                )}

                {idiom.content.extras.origin && (
                  <div className="pt-2 border-t border-indigo-100 mt-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase">Origin: </span>
                    <span className="text-indigo-900 text-sm">{idiom.content.extras.origin}</span>
                  </div>
                )}
              </div>
            )}

            {/* Flashcard Image */}
            <div className="mt-4 pb-4 relative group/image">
              {idiom.content.image_url ? (
                <div className="relative">
                  <FlashcardImage src={idiom.content.image_url} alt={idiom.content.phrase} />
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
                      id={`idiom-card-image-upload-${idiom.id}`}
                    />
                    <label
                      htmlFor={`idiom-card-image-upload-${idiom.id}`}
                      className={cn(
                        "w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                        isUploading
                          ? "border-amber-300 bg-amber-50 opacity-70 cursor-not-allowed"
                          : "border-gray-300 hover:border-amber-500 hover:bg-amber-50 dark:border-gray-700 dark:hover:border-amber-500 dark:hover:bg-amber-900/20"
                      )}
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2 text-amber-600">
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
          </div>
        </div>

      <AdminEditVocabModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        type="idiom"
        cardData={idiom}
      />
    </div>
  );
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};
