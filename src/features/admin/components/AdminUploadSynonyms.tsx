import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Upload, ArrowLeft, ShieldAlert, FileJson, FileText, CheckCircle,
    XCircle, AlertTriangle, Loader2, Save, Trash2, Settings, Pencil
} from 'lucide-react';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useFetchSynonymsByWords, useInsertSynonyms, useFetchSynonymByWordOrId, useUpdateSynonym } from '../hooks/useAdminUploadSynonyms';
import { useNotification } from '../../../hooks/useNotification';
import { AdminBulkUpdateSynonyms } from './AdminBulkUpdateSynonyms';

type UploadMode = 'single' | 'bulk' | 'edit' | 'bulk-update';

interface SynonymForm {
    id?: string;
    word: string;
    pos: string;
    theme: string;
    cluster_id: string;
    meaning: string;
    hindi_meaning: string;
    synonyms: string; // Stored as JSON string in form
    antonyms: string; // Stored as JSON string in form
    confusable_with: string; // Stored as JSON string in form
    importance_score: string;
    lifetime_frequency: string;
    recent_trend: string;
    repetition_raw: string;
}

const initialFormState: SynonymForm = {
    word: '',
    pos: 'Noun',
    theme: 'General',
    cluster_id: '',
    meaning: '',
    hindi_meaning: '',
    synonyms: '[]',
    antonyms: '[]',
    confusable_with: '[]',
    importance_score: '50',
    lifetime_frequency: '0',
    recent_trend: '0',
    repetition_raw: ''
};

export const AdminUploadSynonyms: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useNotification();

    const fetchWordsMutation = useFetchSynonymsByWords();
    const insertMutation = useInsertSynonyms();
    const fetchEditMutation = useFetchSynonymByWordOrId();
    const updateMutation = useUpdateSynonym();

    // Auth Guard
    useEffect(() => {
        if (!user || user.email !== 'admin@mindflow.com') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const [mode, setMode] = useState<UploadMode>('single');

    // Single Upload State
    const [formData, setFormData] = useState<SynonymForm>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jsonErrors, setJsonErrors] = useState({ synonyms: '', antonyms: '', confusable_with: '' });

    // Bulk Upload State
    const [bulkJson, setBulkJson] = useState('');
    const [bulkValidation, setBulkValidation] = useState<{ isValid: boolean; parsedData: any[] | null; error: string | null }>({ isValid: false, parsedData: null, error: null });
    const [duplicateCheck, setDuplicateCheck] = useState<{ checked: boolean; newCount: number; duplicateCount: number; finalData: any[] }>({ checked: false, newCount: 0, duplicateCount: 0, finalData: [] });

    // Edit State
    const [searchEditId, setSearchEditId] = useState('');
    const [isFetchingEdit, setIsFetchingEdit] = useState(false);


    const validateJson = (jsonString: string) => {
        try {
            JSON.parse(jsonString);
            return true;
        } catch {
            return false;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (['synonyms', 'antonyms', 'confusable_with'].includes(name)) {
            setJsonErrors(prev => ({
                ...prev,
                [name]: validateJson(value) ? '' : 'Invalid JSON Array format'
            }));
        }
    };

    const hasAnyJsonError = !!jsonErrors.synonyms || !!jsonErrors.antonyms || !!jsonErrors.confusable_with;

    // --- Actions ---
    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hasAnyJsonError) {
            showToast({ title: "Validation Error", message: "Fix JSON errors before submitting.", variant: "error" });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                importance_score: parseInt(formData.importance_score) || 0,
                lifetime_frequency: parseInt(formData.lifetime_frequency) || 0,
                recent_trend: parseInt(formData.recent_trend) || 0,
                synonyms: JSON.parse(formData.synonyms),
                antonyms: JSON.parse(formData.antonyms),
                confusable_with: JSON.parse(formData.confusable_with),
            };

            await insertMutation.mutateAsync([payload]);
            showToast({ title: "Success", message: "Synonym Added Successfully", variant: "success" });
            setFormData(initialFormState);
        } catch (error: any) {
            console.error("Upload Error:", error);
            showToast({ title: "Upload Failed", message: error.message || "Failed to add Synonym", variant: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setBulkJson(val);
        setDuplicateCheck({ checked: false, newCount: 0, duplicateCount: 0, finalData: [] });

        if (!val.trim()) {
            setBulkValidation({ isValid: false, parsedData: null, error: null });
            return;
        }

        try {
            const parsed = JSON.parse(val);
            if (!Array.isArray(parsed)) {
                setBulkValidation({ isValid: false, parsedData: null, error: "Root must be a JSON Array []" });
            } else if (parsed.length === 0) {
                setBulkValidation({ isValid: false, parsedData: null, error: "Array is empty" });
            } else {
                setBulkValidation({ isValid: true, parsedData: parsed, error: null });
            }
        } catch (err: any) {
            setBulkValidation({ isValid: false, parsedData: null, error: err.message });
        }
    };

    const handleCheckDuplicates = async () => {
        if (!bulkValidation.isValid || !bulkValidation.parsedData) return;
        setIsSubmitting(true);

        try {
            const data = bulkValidation.parsedData;
            const wordsToCheck = data.map((item: any) => item.word).filter(Boolean);

            let existingWords = new Set();
            if (wordsToCheck.length > 0) {
                const existingRecords = await fetchWordsMutation.mutateAsync(wordsToCheck);
                existingWords = new Set(existingRecords?.map((r: any) => r.word));
            }

            const finalDataToInsert: any[] = [];
            let duplicateCount = 0;

            for (const item of data) {
                if (existingWords.has(item.word)) {
                    duplicateCount++;
                } else {
                    // Safe parsing for arrays
                    const payload = {
                         ...item,
                         synonyms: Array.isArray(item.synonyms) ? item.synonyms : (item.synonyms ? JSON.parse(item.synonyms) : []),
                         antonyms: Array.isArray(item.antonyms) ? item.antonyms : (item.antonyms ? JSON.parse(item.antonyms) : []),
                         confusable_with: Array.isArray(item.confusable_with) ? item.confusable_with : (item.confusable_with ? JSON.parse(item.confusable_with) : []),
                    };
                    finalDataToInsert.push(payload);
                }
            }

            setDuplicateCheck({
                checked: true,
                newCount: finalDataToInsert.length,
                duplicateCount: duplicateCount,
                finalData: finalDataToInsert
            });

        } catch (error: any) {
            console.error("Duplicate Check Error:", error);
            showToast({ title: "Check Failed", message: error.message || "Failed to check duplicates.", variant: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkUpload = async () => {
        if (!duplicateCheck.checked || duplicateCheck.finalData.length === 0) return;
        setIsSubmitting(true);
        try {
            await insertMutation.mutateAsync(duplicateCheck.finalData);
            showToast({ title: "Bulk Success", message: `Successfully inserted ${duplicateCheck.finalData.length} Synonyms.`, variant: "success" });
            setBulkJson('');
            setBulkValidation({ isValid: false, parsedData: null, error: null });
            setDuplicateCheck({ checked: false, newCount: 0, duplicateCount: 0, finalData: [] });
        } catch (error: any) {
            console.error("Bulk Upload Error:", error);
            showToast({ title: "Bulk Upload Failed", message: error.message || "Failed to insert rows.", variant: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFetchEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchEditId.trim()) return;

        setIsFetchingEdit(true);
        try {
            const data = await fetchEditMutation.mutateAsync(searchEditId);
            setFormData({
                id: data.id,
                word: data.word || '',
                pos: data.pos || 'Noun',
                theme: data.theme || '',
                cluster_id: data.cluster_id || '',
                meaning: data.meaning || '',
                hindi_meaning: data.hindi_meaning || '',
                synonyms: typeof data.synonyms === 'string' ? data.synonyms : JSON.stringify(data.synonyms || []),
                antonyms: typeof data.antonyms === 'string' ? data.antonyms : JSON.stringify(data.antonyms || []),
                confusable_with: typeof data.confusable_with === 'string' ? data.confusable_with : JSON.stringify(data.confusable_with || []),
                importance_score: data.importance_score ? data.importance_score.toString() : '0',
                lifetime_frequency: data.lifetime_frequency ? data.lifetime_frequency.toString() : '0',
                recent_trend: data.recent_trend ? data.recent_trend.toString() : '0',
                repetition_raw: data.repetition_raw || ''
            });
            showToast({ title: "Found", message: "Synonym loaded for editing.", variant: "success" });
        } catch (error: any) {
            console.error("Fetch Error:", error);
            showToast({ title: "Not Found", message: `Could not find Synonym with Word/ID: ${searchEditId}`, variant: "error" });
            setFormData(initialFormState); // Reset if not found
        } finally {
            setIsFetchingEdit(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hasAnyJsonError) {
            showToast({ title: "Validation Error", message: "Fix JSON errors before updating.", variant: "error" });
            return;
        }

        setIsSubmitting(true);
        try {
             const payload = {
                ...formData,
                importance_score: parseInt(formData.importance_score) || 0,
                lifetime_frequency: parseInt(formData.lifetime_frequency) || 0,
                recent_trend: parseInt(formData.recent_trend) || 0,
                synonyms: JSON.parse(formData.synonyms),
                antonyms: JSON.parse(formData.antonyms),
                confusable_with: JSON.parse(formData.confusable_with),
            };

            await updateMutation.mutateAsync(payload);
            showToast({ title: "Update Success", message: "Synonym updated successfully.", variant: "success" });
            setSearchEditId('');
            setFormData(initialFormState);
            setMode('single'); // Return to single upload mode
        } catch (error: any) {
            console.error("Update Error:", error);
            showToast({ title: "Update Failed", message: error.message || "Failed to update Synonym.", variant: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (!user || user.email !== 'admin@mindflow.com') return null;

    return (
        <div className="min-h-screen pt-4 pb-24 px-4 w-full flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <header className="flex items-center justify-between mb-6 relative z-10">
                <button
                    onClick={() => navigate('/admin')}
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-cyan-500" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-cyan-400 dark:from-cyan-400 dark:to-cyan-300">
                        Synonyms Upload Center
                    </h1>
                </div>
                <div className="w-10"></div>
            </header>

            {/* Mode Switcher */}
            <div className="relative z-10 w-full max-w-4xl mx-auto mb-8 grid grid-cols-2 md:flex gap-1 md:gap-0 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl backdrop-blur-md">
                <button
                    onClick={() => setMode('single')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        mode === 'single'
                            ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    Single Upload
                </button>
                <button
                    onClick={() => setMode('bulk')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        mode === 'bulk'
                            ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <FileJson className="w-4 h-4" />
                    Bulk JSON Upload
                </button>
                <button
                    onClick={() => { setMode('edit'); setFormData(initialFormState); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        mode === 'edit'
                            ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Pencil className="w-4 h-4" />
                    Edit Synonym
                </button>
                <button
                    onClick={() => setMode('bulk-update')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        mode === 'bulk-update'
                            ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    Bulk Update
                </button>
            </div>

            {/* Main Content Area */}
            <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 w-full max-w-4xl mx-auto"
            >
                {/* --- SINGLE UPLOAD MODE --- */}
                {mode === 'single' && (
                    <form onSubmit={handleSingleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-cyan-500" />
                                Single Synonym Upload
                            </h2>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1.5">
                                <Save className="w-3 h-3" /> Auto-saving draft
                            </span>
                        </div>

                        {/* Core Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Word</label>
                                <input required name="word" value={formData.word} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-lg font-bold text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Part of Speech (POS)</label>
                                <select required name="pos" value={formData.pos} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none">
                                    <option value="Noun">Noun</option>
                                    <option value="Verb">Verb</option>
                                    <option value="Adjective">Adjective</option>
                                    <option value="Adverb">Adverb</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Theme / Category</label>
                                <input name="theme" value={formData.theme} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none text-base" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cluster ID</label>
                                <input name="cluster_id" value={formData.cluster_id} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none text-base" />
                            </div>
                        </div>

                        {/* Meanings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meaning (English)</label>
                                <textarea required name="meaning" value={formData.meaning} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-base" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meaning (Hindi)</label>
                                <textarea name="hindi_meaning" value={formData.hindi_meaning} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-base" />
                            </div>
                        </div>

                        {/* Relations JSON */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Synonyms (JSON)</label>
                                </div>
                                <textarea name="synonyms" value={formData.synonyms} onChange={handleChange} rows={3} className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 resize-y ${jsonErrors.synonyms ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-cyan-500'}`} />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Antonyms (JSON)</label>
                                </div>
                                <textarea name="antonyms" value={formData.antonyms} onChange={handleChange} rows={3} className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 resize-y ${jsonErrors.antonyms ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-cyan-500'}`} />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confusable With (JSON)</label>
                                </div>
                                <textarea name="confusable_with" value={formData.confusable_with} onChange={handleChange} rows={3} className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 resize-y ${jsonErrors.confusable_with ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-cyan-500'}`} />
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Importance</label>
                                <input type="number" name="importance_score" value={formData.importance_score} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                                <input type="number" name="lifetime_frequency" value={formData.lifetime_frequency} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trend</label>
                                <input type="number" name="recent_trend" value={formData.recent_trend} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Repetition Raw</label>
                                <input name="repetition_raw" value={formData.repetition_raw} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || hasAnyJsonError}
                            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {isSubmitting ? 'Uploading to Database...' : 'Upload Synonym'}
                        </button>
                    </form>
                )}

                {/* --- BULK UPLOAD MODE --- */}
                {mode === 'bulk' && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileJson className="w-5 h-5 text-cyan-500" />
                                Bulk JSON Upload
                            </h2>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Paste JSON Array of Objects</label>
                                {bulkJson && (
                                    <span className={`text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 ${bulkValidation.isValid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {bulkValidation.isValid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        {bulkValidation.isValid ? 'Valid Array' : 'Syntax Error'}
                                    </span>
                                )}
                            </div>
                            <textarea
                                value={bulkJson}
                                onChange={handleBulkJsonChange}
                                placeholder='[\n  {\n    "word": "Abundant",\n    "pos": "Adjective",\n    "meaning": "Existing or available in large quantities; plentiful.",\n    "hindi_meaning": "प्रचुर",\n    "synonyms": ["plentiful", "copious", "ample"],\n    "antonyms": ["scarce", "sparse"],\n    "theme": "Quantity",\n    "importance_score": 85\n  }\n]'
                                rows={15}
                                className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-4 py-4 outline-none focus:ring-2 transition-shadow resize-y shadow-inner ${bulkJson && !bulkValidation.isValid ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-cyan-500'}`}
                            />
                            {bulkValidation.error && (
                                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p className="break-all">{bulkValidation.error}</p>
                                </div>
                            )}
                        </div>

                        {!duplicateCheck.checked ? (
                            <button
                                onClick={handleCheckDuplicates}
                                disabled={!bulkValidation.isValid || isSubmitting}
                                className="w-full py-4 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                                Check Validation & Duplicates
                            </button>
                        ) : (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="text-2xl font-black text-cyan-500">{duplicateCheck.newCount}</div>
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">New To Upload</div>
                                    </div>
                                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm opacity-70">
                                        <div className="text-2xl font-black text-teal-500">{duplicateCheck.duplicateCount}</div>
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Duplicates Skipped</div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleBulkUpload}
                                    disabled={duplicateCheck.newCount === 0 || isSubmitting}
                                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                    {isSubmitting ? 'Inserting...' : `Upload ${duplicateCheck.newCount} Valid Synonyms`}
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* --- EDIT MODE --- */}
                {mode === 'edit' && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-cyan-500" />
                                Edit Existing Synonym
                            </h2>
                        </div>

                        {/* Search Fetch Form */}
                        <form onSubmit={handleFetchEdit} className="flex gap-3">
                            <input
                                type="text"
                                value={searchEditId}
                                onChange={(e) => setSearchEditId(e.target.value)}
                                placeholder="Enter Word or ID to edit..."
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={isFetchingEdit || !searchEditId.trim()}
                                className="px-6 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
                            >
                                {isFetchingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch Data'}
                            </button>
                        </form>

                        {/* Populated Edit Form */}
                        {formData.id && (
                            <form onSubmit={handleEditSubmit} className="flex flex-col gap-6 mt-4 pt-6 border-t border-slate-100 dark:border-slate-800">

                                {/* Core Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Word</label>
                                        <input required name="word" value={formData.word} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-lg font-bold text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Part of Speech (POS)</label>
                                        <select required name="pos" value={formData.pos} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none">
                                            <option value="Noun">Noun</option>
                                            <option value="Verb">Verb</option>
                                            <option value="Adjective">Adjective</option>
                                            <option value="Adverb">Adverb</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Theme / Category</label>
                                        <input name="theme" value={formData.theme} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none text-base" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cluster ID</label>
                                        <input name="cluster_id" value={formData.cluster_id} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none text-base" />
                                    </div>
                                </div>

                                {/* Meanings */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meaning (English)</label>
                                        <textarea required name="meaning" value={formData.meaning} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-base" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meaning (Hindi)</label>
                                        <textarea name="hindi_meaning" value={formData.hindi_meaning} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-base" />
                                    </div>
                                </div>

                                {/* Relations JSON */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Synonyms (JSON)</label>
                                        </div>
                                        <textarea name="synonyms" value={formData.synonyms} onChange={handleChange} rows={3} className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 resize-y ${jsonErrors.synonyms ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-cyan-500'}`} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Antonyms (JSON)</label>
                                        </div>
                                        <textarea name="antonyms" value={formData.antonyms} onChange={handleChange} rows={3} className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 resize-y ${jsonErrors.antonyms ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-cyan-500'}`} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confusable With (JSON)</label>
                                        </div>
                                        <textarea name="confusable_with" value={formData.confusable_with} onChange={handleChange} rows={3} className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 resize-y ${jsonErrors.confusable_with ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-cyan-500'}`} />
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Importance</label>
                                        <input type="number" name="importance_score" value={formData.importance_score} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                                        <input type="number" name="lifetime_frequency" value={formData.lifetime_frequency} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trend</label>
                                        <input type="number" name="recent_trend" value={formData.recent_trend} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Repetition Raw</label>
                                        <input name="repetition_raw" value={formData.repetition_raw} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none" />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || hasAnyJsonError}
                                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {isSubmitting ? 'Updating Database...' : 'Update Synonym Record'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* --- BULK UPDATE MODE --- */}
                {mode === 'bulk-update' && <AdminBulkUpdateSynonyms />}

            </motion.div>
        </div>
    );
};
