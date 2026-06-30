import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2 } from 'lucide-react';
import { useUpdateQuestion } from '../hooks/useAdminUploadGK';
import { Question } from '../../quiz/types';
import { useQuizSessionStore } from '../../quiz/stores/useQuizSessionStore';
import { useNotification } from '../../../hooks/useNotification';

interface AdminEditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
}

export const AdminEditQuestionModal: React.FC<AdminEditQuestionModalProps> = ({
  isOpen,
  onClose,
  question,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { mutate: editQuestion, isPending } = useUpdateQuestion();
  const hydrateQuestions = useQuizSessionStore((state) => state.hydrateQuestions);
  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen && question) {
      const initial = {
        v1_id: question.v1_id || '',
        subject: question.subject || question.classification?.subject || '',
        topic: question.topic || question.classification?.topic || '',
        subTopic: question.subTopic || question.classification?.subTopic || '',
        examName: question.examName || question.sourceInfo?.examName || '',
        examYear: question.examYear || question.sourceInfo?.examYear || '',
        examDateShift: question.examDateShift || question.sourceInfo?.examDateShift || '',
        difficulty: question.properties?.difficulty || '',
        questionType: question.properties?.questionType || '',
        question: question.question || '',
        question_hi: question.question_hi || '',
        options: JSON.stringify(question.options || [], null, 2),
        options_hi: JSON.stringify(question.options_hi || [], null, 2),
        correct: question.correct || '',
        tags: JSON.stringify(question.tags || [], null, 2),
        explanation: JSON.stringify(question.explanation || {}, null, 2),
      };
      setFormData(initial);
      setInitialData(initial);
      setValidationErrors({});
    }
  }, [isOpen, question]);

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
    const errors: Record<string, string> = {};

    // Validate enum fields
    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    if (updates.difficulty && !validDifficulties.includes(updates.difficulty)) {
        errors.difficulty = `Expected one of ${validDifficulties.join(', ')}. Received: ${updates.difficulty}`;
    }

    // Convert integer fields
    if (updates.examYear) {
      const parsed = parseInt(updates.examYear, 10);
      if (isNaN(parsed)) {
        errors.examYear = 'Must be a valid integer.';
      } else {
        updates.examYear = parsed;
      }
    } else {
      updates.examYear = null;
    }

    // JSON Validation Helper
    const validateJson = (fieldName: string, value: any, expectedType: 'array' | 'object') => {
      if (!value || value.trim() === '') {
        return expectedType === 'array' ? [] : {};
      }
      try {
        const parsed = JSON.parse(value);
        if (expectedType === 'array' && !Array.isArray(parsed)) {
          errors[fieldName] = 'Expected a JSON array.';
          return null;
        }
        if (expectedType === 'object' && (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null)) {
            errors[fieldName] = 'Expected a JSON object.';
            return null;
        }
        return parsed;
      } catch (e: any) {
        errors[fieldName] = `Invalid JSON: ${e.message}`;
        return null;
      }
    };

    updates.options = validateJson('options', updates.options, 'array');
    updates.options_hi = validateJson('options_hi', updates.options_hi, 'array');
    updates.tags = validateJson('tags', updates.tags, 'array');
    updates.explanation = validateJson('explanation', updates.explanation, 'object');

    // Cross-field validation: Correct option must be inside options array
    if (updates.options && updates.correct && !updates.options.includes(updates.correct)) {
        errors.correct = `The correct answer must be exactly one of the provided options.`;
    }

    if (updates.questionType === 'MCQ' && updates.options && updates.options.length < 2) {
        errors.options = `MCQ must have at least 2 options.`;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Prepare payload for update
    const payload = {
      id: question.id,
      ...updates
    };

    editQuestion(payload, {
      onSuccess: () => {
        // Construct the updated question object for store hydration
        const updatedQuestion: Question = {
            ...question,
            v1_id: updates.v1_id,
            subject: updates.subject,
            topic: updates.topic,
            subTopic: updates.subTopic,
            examName: updates.examName,
            examYear: updates.examYear,
            examDateShift: updates.examDateShift,
            question: updates.question,
            question_hi: updates.question_hi,
            options: updates.options,
            options_hi: updates.options_hi,
            correct: updates.correct,
            tags: updates.tags,
            explanation: updates.explanation,
            properties: {
                ...question.properties,
                difficulty: updates.difficulty,
                questionType: updates.questionType
            },
            sourceInfo: {
                ...question.sourceInfo,
                examName: updates.examName,
                examYear: updates.examYear,
                examDateShift: updates.examDateShift
            },
            classification: {
                ...question.classification,
                subject: updates.subject,
                topic: updates.topic,
                subTopic: updates.subTopic
            }
        };

        hydrateQuestions([updatedQuestion]);
        showToast({ variant: 'success', message: 'Question updated successfully.', duration: 2000 });
        onClose();
      },
      onError: (err) => {
        showToast({ variant: 'error', message: `Update failed: ${err.message}`, duration: 3000 });
      }
    });
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
              <span className="text-2xl">✏️</span> Edit Question
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
          {Object.entries(formData).map(([key, value]) => {
              const isJsonField = ['options', 'options_hi', 'tags', 'explanation'].includes(key);
              const isTextArea = ['question', 'question_hi', ...isJsonField ? ['options', 'options_hi', 'tags', 'explanation'] : []].includes(key);
              return (
                <div key={key} className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  {isTextArea ? (
                    <textarea
                      name={key}
                      value={value as string}
                      onChange={handleChange}
                      rows={isJsonField ? 8 : 4}
                      className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border ${validationErrors[key] ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'} rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition-all ${isJsonField ? 'font-mono' : ''}`}
                      dir={key.includes('hi') ? 'auto' : 'ltr'}
                    />
                  ) : (
                    <input
                      type="text"
                      name={key}
                      value={value as string}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border ${validationErrors[key] ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'} rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition-all`}
                      dir={key.includes('hi') ? 'auto' : 'ltr'}
                    />
                  )}
                  {validationErrors[key] && (
                    <p className="text-red-500 text-xs mt-1 font-medium bg-red-50 p-2 rounded">{validationErrors[key]}</p>
                  )}
                  {key === 'options' && (
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Expected format: <br/><pre className="inline-block bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1">{`[\n  "Option A",\n  "Option B"\n]`}</pre>
                    </p>
                  )}
                  {key === 'explanation' && (
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Expected format: <br/><pre className="inline-block bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1">{`{\n  "summary": "Text...",\n  "analysis_correct": "..."\n}`}</pre>
                    </p>
                  )}
                </div>
              )
          })}
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
