import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2 } from 'lucide-react';
import { useAdminEditVocab } from '../../vocab/hooks/useAdminEditVocab';

type VocabType = 'idiom' | 'ows' | 'synonym';

interface AdminEditVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: VocabType;
  cardData: any; // Using any here to support the three different structures
}

export const AdminEditVocabModal: React.FC<AdminEditVocabModalProps> = ({
  isOpen,
  onClose,
  type,
  cardData,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { mutate: editVocab, isPending } = useAdminEditVocab();

  useEffect(() => {
    if (isOpen && cardData) {
      if (type === 'idiom') {
        const initial = {
          phrase: cardData.content?.phrase || '',
          meaning_english: cardData.content?.meanings?.english || '',
          meaning_hindi: cardData.content?.meanings?.hindi || '',
          usage: cardData.content?.usage || '',
          mnemonic: cardData.content?.extras?.mnemonic || '',
          origin: cardData.content?.extras?.origin || '',
          difficulty: cardData.properties?.difficulty || '',
          source_pdf: cardData.sourceInfo?.pdfName || '',
          exam_year: cardData.sourceInfo?.examYear || '',
        };
        setFormData(initial);
        setInitialData(initial);
      } else if (type === 'ows') {
        const initial = {
          word: cardData.content?.word || '',
          pos: cardData.content?.pos || '',
          meaning_english: cardData.content?.meaning_en || '',
          meaning_hindi: cardData.content?.meaning_hi || '',
          usage_sentences: (cardData.content?.usage_sentences || []).join('\n'), // Textarea handling
          root_word: cardData.content?.origin || '',
          mnemonic: cardData.content?.note || '',
          difficulty: cardData.properties?.difficulty || '',
          source_pdf: cardData.sourceInfo?.pdfName || '',
          exam_year: cardData.sourceInfo?.examYear || '',
        };
        setFormData(initial);
        setInitialData(initial);
      } else if (type === 'synonym') {
        const initial = {
          word: cardData.word || '',
          pos: cardData.pos || '',
          meaning: cardData.meaning || '',
          hindi_meaning: cardData.hindiMeaning || '',
          theme: cardData.theme || '',
          cluster_id: cardData.cluster_id || '',
          exam_name: cardData.examName || cardData.exam_name || '',
          exam_year: cardData.examYear || cardData.exam_year || '',
          difficulty: cardData.difficulty || '',
          importance_score: cardData.importance_score || '',
          lifetime_frequency: cardData.lifetime_frequency || '',
          recent_trend: cardData.recent_trend || '',
          synonyms: JSON.stringify(cardData.synonyms || [], null, 2),
          antonyms: JSON.stringify(cardData.antonyms || [], null, 2),
          confusable_with: JSON.stringify(cardData.confusable_with || [], null, 2)
        };
        setFormData(initial);
        setInitialData(initial);
      }
    }
  }, [isOpen, cardData, type]);


  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, initialData]);

  if (!isOpen) return null;

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  };

  const handleClose = () => {
    if (hasUnsavedChanges() && !window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
      return;
    }
    onClose();
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSave = () => {
    const updates: Record<string, any> = { ...formData };

    // Format specific fields back to proper types
    if (type === 'ows' && typeof updates.usage_sentences === 'string') {
        updates.usage_sentences = updates.usage_sentences.split('\n').filter((s: string) => s.trim() !== '');
    }

    if (type === 'idiom' || type === 'ows') {
        if (updates.exam_year) {
            updates.exam_year = parseInt(updates.exam_year, 10);
        } else {
            updates.exam_year = null;
        }
    }


    const errors: Record<string, string> = {};

    if (type === 'synonym') {
      const validateJsonArray = (fieldName: string, value: any, requireText: boolean) => {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            errors[fieldName] = 'Expected a JSON array.';
            return null;
          }
          if (requireText) {
             for (let i = 0; i < parsed.length; i++) {
                if (typeof parsed[i] !== 'object' || parsed[i] === null) {
                   errors[fieldName] = `Item ${i + 1} must be an object.`;
                   return null;
                }
                if (typeof parsed[i].text !== 'string') {
                   errors[fieldName] = `Item ${i + 1} is missing required string field "text".`;
                   return null;
                }
             }
          } else if (fieldName === 'confusable_with') {
             for (let i = 0; i < parsed.length; i++) {
                if (typeof parsed[i] !== 'string' && (typeof parsed[i] !== 'object' || parsed[i] === null || typeof parsed[i].text !== 'string')) {
                   errors[fieldName] = `Item ${i + 1} must be a string or an object with a "text" string field.`;
                   return null;
                }
             }
          }
          return parsed;
        } catch (e: any) {
          errors[fieldName] = `Invalid JSON: ${e.message}`;
          return null;
        }
      };

      updates.synonyms = validateJsonArray('synonyms', updates.synonyms, true);
      updates.antonyms = validateJsonArray('antonyms', updates.antonyms, true);
      updates.confusable_with = validateJsonArray('confusable_with', updates.confusable_with, false);

      ['exam_year', 'importance_score', 'lifetime_frequency', 'recent_trend'].forEach(key => {
        if (updates[key] !== undefined && updates[key] !== '') {
          const parsed = parseInt(updates[key], 10);
          if (isNaN(parsed)) {
            errors[key] = 'Must be a valid integer.';
          } else {
            updates[key] = parsed;
          }
        } else if (updates[key] === '') {
          updates[key] = null;
        }
      });

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
    }


    editVocab(
      { id: cardData.id, type, updates },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 mb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl">✏️</span> Edit {type.toUpperCase()}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Admin controls for direct database updates
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {Object.entries(formData).map(([key, value]) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {key.replace(/_/g, ' ')}
              </label>
                            {(key === 'synonyms' || key === 'antonyms' || key === 'confusable_with' || key === 'usage_sentences' || key === 'usage' || key === 'mnemonic' || key === 'origin' || key === 'meaning_english' || key === 'meaning_hindi' || key === 'meaning' || key === 'hindi_meaning') ? (
                <textarea
                  name={key}
                  value={value as string}
                  onChange={handleChange}
                  rows={(key === 'synonyms' || key === 'antonyms' || key === 'confusable_with') ? 8 : 4}
                  className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border ${validationErrors[key] ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'} rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition-all font-mono`}
                  dir={key.includes('hindi') ? 'auto' : 'ltr'}
                />
              ) : (
                <input
                  type="text"
                  name={key}
                  value={value as string}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border ${validationErrors[key] ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'} rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition-all`}
                  dir={key.includes('hindi') ? 'auto' : 'ltr'}
                />
              )}
              {validationErrors[key] && (
                <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors[key]}</p>
              )}
              {(key === 'synonyms' || key === 'antonyms') && (
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Expected format: <br/><pre className="inline-block bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1">{`[\n  {\n    "text": "leave",\n    "meaning": "go away from"\n  }\n]`}</pre>
                </p>
              )}
              {key === 'confusable_with' && (
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Expected format: <br/><pre className="inline-block bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1">{`[\n  {\n    "text": "abdicate",\n    "reason": "giving up authority"\n  }\n]`}</pre>
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
