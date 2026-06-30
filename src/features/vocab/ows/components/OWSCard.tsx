import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../../../../utils/cn';
import { OneWord } from '../../../../types/models';
import { BookOpen, Lightbulb, RotateCw, Target, Tag, CheckCircle2, Circle, ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { useOWSProgress } from '../hooks/useOWSProgress';
import { useFlashcardStore } from '../../../../features/quiz/stores/useFlashcardStore';
import { FlashcardImage } from '../../../../components/ui/FlashcardImage';
import { useAuth } from '../../../../features/auth/context/AuthContext';
import { uploadMediaToCloudinary } from '../../../../services/mediaUploadService';
import { supabase } from '../../../../lib/supabase';
import { useNotification } from '../../../../hooks/useNotification';
import { useAdminDeleteVocab } from '../../hooks/useAdminDeleteVocab';
import { AdminEditVocabModal } from '../../../../features/admin/components/AdminEditVocabModal';
import { Edit } from 'lucide-react';

/**
 * Props for the One Word Substitution (OWS) Card.
 */
interface OWSCardProps {
  /** The One Word Substitution data object. */
  data: OneWord;
  /** The serial number of the card in the current session (1-based). */
  serialNumber: number;
  /** Whether the card is flipped (showing the back). */
  isFlipped: boolean;
}

/**
 * A 3D flipping flashcard component for One Word Substitutions.
 *
 * Displays the word on the front and its definition, usage, and etymology on the back.
 * Similar to the `Flashcard` component but tailored for OWS content structure.
 *
 * @param {OWSCardProps} props - The component props.
 * @returns {JSX.Element} The rendered OWS Card.
 */
export const OWSCard: React.FC<OWSCardProps> = ({ data: initialData, serialNumber, isFlipped }) => {
  const { mutate: deleteVocab, isPending: isDeleting } = useAdminDeleteVocab();
  const [data, setData] = useState<OneWord>(initialData);
  const { getKnownStatus, toggleKnownStatus } = useOWSProgress();
  const updateCardImage = useFlashcardStore((state) => state.updateCardImage);
  const isKnown = getKnownStatus(data);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isAdmin = user?.email === 'admin@mindflow.com';
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isAdmin) return;

    setIsUploading(true);
    try {
      const url = await uploadMediaToCloudinary({ file, resourceType: "image" });

      const { error } = await supabase
        .from("ows")
        .update({ image_url: url })
        .eq("id", data.db_id || data.id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          image_url: url
        }
      }));

      showToast({ title: "Success", message: "Image added successfully", variant: "success" });
      updateCardImage(data.id, "ows", url);
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
        .from("ows")
        .update({ image_url: null })
        .eq("id", data.db_id || data.id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          image_url: undefined
        }
      }));

      showToast({ title: "Removed", message: "Image removed successfully", variant: "success" });
      updateCardImage(data.id, "ows", undefined);
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
    if (window.confirm('Are you sure you want to permanently delete this ows?')) {
      deleteVocab({ id: data.id, type: 'ows' });
    }
  };


  return (
    <div className="relative w-full h-full perspective-1000 cursor-pointer group">
      <div
        className={cn(
          "relative w-full h-full transition-transform transform-style-3d shadow-xl rounded-3xl",
          isFlipped ? "rotate-y-180" : ""
        )}
        style={{ transitionDuration: isFlipped ? "500ms" : "0ms" }}
      >
        {/* --- FRONT FACE --- */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">

          {/* Header Decoration */}
          <div className="h-2 w-full bg-gradient-to-r from-teal-400 to-cyan-500"></div>

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
                <div className="flex items-center gap-1 text-teal-600 font-medium bg-teal-50 px-2 py-1 rounded-md text-xs shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Read
                </div>
              )}
            </div>

          <div className="absolute top-4 right-4 text-teal-100">
            <RotateCw className="w-6 h-6" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-teal-50/30">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 mb-2 shadow-sm">
              <Target className="w-8 h-8" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white dark:text-white leading-tight drop-shadow-sm font-serif">
              {data.content.word}
            </h2>

            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-4">
              Tap to Reveal Meaning
            </p>
          </div>

          {/* Footer Tags */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{data.properties?.difficulty}</span>
            <span>#{serialNumber}</span>
            <span>{data.sourceInfo.pdfName} | {data.sourceInfo.examYear}</span>
          </div>
        </div>

        {/* --- BACK FACE --- */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
          {/* Header */}
          <div className="bg-teal-50 p-4 border-b border-teal-100 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-teal-900 truncate max-w-[200px] font-serif text-lg">{data.content.word}</h3>
              <span className="text-[10px] px-2 py-0.5 bg-teal-200 text-teal-800 rounded-full font-bold uppercase tracking-wide">
                {data.content.pos}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleKnownStatus(data);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95",
                  isKnown
                    ? "bg-teal-600 text-white hover:bg-teal-700 ring-2 ring-teal-200"
                    : "bg-white text-gray-500 hover:text-teal-600 hover:bg-teal-50 border border-gray-200"
                )}
              >
                {isKnown ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                {isKnown ? 'Known' : 'Mark as Known'}
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">

            {/* Meanings */}
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 border-teal-500 shadow-sm ring-1 ring-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meaning</p>
                <p className="text-gray-800 dark:text-gray-100 font-medium leading-relaxed text-lg">{data.content.meaning_en}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 border-cyan-400 shadow-sm ring-1 ring-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Hindi Meaning</p>
                <p className="text-gray-800 dark:text-gray-100 font-hindi font-medium text-lg">{data.content.meaning_hi}</p>
              </div>
            </div>

            {/* Usage */}
            {data.content.usage_sentences && data.content.usage_sentences.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Examples</p>
                <ul className="list-disc list-outside pl-4 space-y-1 text-gray-600 dark:text-gray-300 italic text-sm leading-relaxed">
                  {data.content.usage_sentences.map((sentence, idx) => (
                    <li key={idx}>{sentence}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Extras (Note & Origin) */}
            {(data.content.note || data.content.origin) && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">

                {data.content.note && (
                  <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Note</span>
                      <span className="text-slate-700 text-sm">{data.content.note}</span>
                    </div>
                  </div>
                )}

                {data.content.origin && (
                  <div className={cn("flex gap-3", data.content.note && "pt-3 border-t border-slate-200")}>
                    <Tag className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Origin</span>
                      <span className="text-slate-700 text-sm font-serif italic">{data.content.origin}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Flashcard Image */}
            <div className="mt-4 pb-4 relative group/image">
              {data.content.image_url ? (
                <div className="relative">
                  <FlashcardImage src={data.content.image_url} alt={data.content.word} />
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
                      id={`ows-card-image-upload-${data.id}`}
                    />
                    <label
                      htmlFor={`ows-card-image-upload-${data.id}`}
                      className={cn(
                        "w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                        isUploading
                          ? "border-teal-300 bg-teal-50 opacity-70 cursor-not-allowed"
                          : "border-gray-300 hover:border-teal-500 hover:bg-teal-50 dark:border-gray-700 dark:hover:border-teal-500 dark:hover:bg-teal-900/20"
                      )}
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2 text-teal-600">
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
        type="ows"
        cardData={data}
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
