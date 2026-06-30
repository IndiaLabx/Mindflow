import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/useNotificationStore';

export type MaterialType = 'NCERT Textbook' | 'Study Notes' | 'MCQ Test' | 'Chapter Test' | 'Other Test' | 'Answer Key';

export interface StudyMaterial {
    id: string;
    class: string;
    subject: string;
    chapter: string;
    type: MaterialType;
    title: string;
    file_url: string;
    status: boolean;
    parts?: string | null;
}

interface AdminEditMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    material: StudyMaterial | null;
    onSuccess: (updatedMaterial: StudyMaterial) => void;
}

const CLASSES = ['Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X', 'Class XI', 'Class XII'];
const TYPES: MaterialType[] = ['NCERT Textbook', 'Study Notes', 'MCQ Test', 'Chapter Test', 'Other Test', 'Answer Key'];

export const AdminEditMaterialModal: React.FC<AdminEditMaterialModalProps> = ({ isOpen, onClose, material, onSuccess }) => {
    const { showToast } = useNotificationStore();
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<StudyMaterial>>({});

    // Reset form when material changes
    React.useEffect(() => {
        if (material) {
            setFormData({
                class: material.class,
                subject: material.subject,
                chapter: material.chapter,
                type: material.type,
                title: material.title,
                parts: material.parts || ''
            });
        }
    }, [material]);

    const handleSave = async () => {
        if (!material || !formData.class || !formData.subject || !formData.chapter || !formData.type || !formData.title) {
            showToast({ title: 'Error', message: 'All fields are required.', variant: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const updatePayload = {
                class: formData.class,
                subject: formData.subject.trim(),
                chapter: formData.chapter.trim(),
                type: formData.type,
                title: formData.title.trim(),
                parts: formData.parts ? formData.parts.trim() : null
            };

            const { error, data } = await supabase
                .from('study_materials')
                .update(updatePayload)
                .eq('id', material.id)
                .select();

            if (error) throw error;

            showToast({ title: 'Success', message: 'Material metadata updated!', variant: 'success' });
            onSuccess(data[0] as StudyMaterial);
            onClose();
        } catch (error: any) {
            console.error('Update error:', error);
            showToast({ title: 'Error', message: error.message || 'Failed to update metadata.', variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !material) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Material Metadata</h2>
                            <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/50 dark:bg-slate-800/50 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class</label>
                                    <select
                                        value={formData.class || ''}
                                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    >
                                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Material Type</label>
                                    <select
                                        value={formData.type || ''}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as MaterialType })}
                                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    >
                                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject</label>
                                <input
                                    type="text"
                                    value={formData.subject || ''}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chapter</label>
                                <input
                                    type="text"
                                    value={formData.chapter || ''}
                                    onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Display Title</label>
                                <input
                                    type="text"
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Parts (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.parts || ''}
                                    onChange={(e) => setFormData({ ...formData, parts: e.target.value })}
                                    placeholder="e.g. 1 or I"
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isSaving}
                                className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
