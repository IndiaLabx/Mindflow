import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Upload, ArrowLeft, ShieldAlert, FileJson, FileText, CheckCircle,
    XCircle, AlertTriangle, Loader2, Save, Trash2, Settings, Pencil
} from 'lucide-react';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useFetchOwsByV1Ids, useFetchOwsByWords, useInsertOws, useFetchOwsByWordOrId, useUpdateOws } from '../hooks/useAdminUploadOWS';
import { useNotification } from '../../../hooks/useNotification';
import { AdminBulkUpdateOWS } from './AdminBulkUpdateOWS';

type UploadMode = 'single' | 'bulk' | 'edit' | 'bulk-update';

interface OwsForm {
    id?: string;
    v1_id: string;
    word: string;
    pos: string;
    meaning_english: string;
    meaning_hindi: string;
    usage_sentences: string; // Stored as JSON string in form
    source_pdf: string;
    exam_year: string;
    difficulty: string;
    status: string;
}

const initialFormState: OwsForm = {
    v1_id: '',
    word: '',
    pos: 'Noun',
    meaning_english: '',
    meaning_hindi: '',
    usage_sentences: '[]',
    source_pdf: 'TCS PYQ',
    exam_year: new Date().getFullYear().toString(),
    difficulty: 'Medium',
    status: 'active'
};

export const AdminUploadOWS: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useNotification();

    const fetchV1IdsMutation = useFetchOwsByV1Ids();
    const fetchWordsMutation = useFetchOwsByWords();
    const insertMutation = useInsertOws();
    const fetchEditMutation = useFetchOwsByWordOrId();
    const updateMutation = useUpdateOws();

    // Auth Guard
    useEffect(() => {
        if (!user || user.email !== 'admin@mindflow.com') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const [mode, setMode] = useState<UploadMode>('single');

    // Single Upload State
    const [formData, setFormData] = useState<OwsForm>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jsonError, setJsonError] = useState('');

    // Bulk Upload State
    const [bulkJson, setBulkJson] = useState('');
    const [bulkValidation, setBulkValidation] = useState<{ isValid: boolean; parsedData: any[] | null; error: string | null }>({ isValid: false, parsedData: null, error: null });
    const [duplicateCheck, setDuplicateCheck] = useState<{ checked: boolean; newCount: number; duplicateCount: number; finalData: any[] }>({ checked: false, newCount: 0, duplicateCount: 0, finalData: [] });

    // Edit State
    const [searchEditId, setSearchEditId] = useState('');
    const [isFetchingEdit, setIsFetchingEdit] = useState(false);

    // --- Helpers ---
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

        if (name === 'usage_sentences') {
            setJsonError(validateJson(value) ? '' : 'Invalid JSON Array format');
        }
    };

    // --- Actions ---
    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (jsonError) {
            showToast({ title: "Validation Error", message: "Fix JSON errors before submitting.", variant: "error" });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                exam_year: parseInt(formData.exam_year) || null,
                usage_sentences: JSON.parse(formData.usage_sentences)
            };

            await insertMutation.mutateAsync([payload]);
            showToast({ title: "Success", message: "OWS Added Successfully", variant: "success" });
            setFormData(initialFormState);
        } catch (error: any) {
            console.error("Upload Error:", error);
            showToast({ title: "Upload Failed", message: error.message || "Failed to add OWS", variant: "error" });
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
                    // Ensure usage_sentences is properly typed if provided as array
                    const payload = {
                         ...item,
                         usage_sentences: Array.isArray(item.usage_sentences) ? item.usage_sentences : (item.usage_sentences ? JSON.parse(item.usage_sentences) : [])
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
            showToast({ title: "Bulk Success", message: `Successfully inserted ${duplicateCheck.finalData.length} OWS.`, variant: "success" });
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
                v1_id: data.v1_id || '',
                word: data.word || '',
                pos: data.pos || 'Noun',
                meaning_english: data.meaning_english || '',
                meaning_hindi: data.meaning_hindi || '',
                usage_sentences: typeof data.usage_sentences === 'string' ? data.usage_sentences : JSON.stringify(data.usage_sentences || []),
                source_pdf: data.source_pdf || '',
                exam_year: data.exam_year ? data.exam_year.toString() : '',
                difficulty: data.difficulty || 'Medium',
                status: data.status || 'active'
            });
            showToast({ title: "Found", message: "OWS loaded for editing.", variant: "success" });
        } catch (error: any) {
            console.error("Fetch Error:", error);
            showToast({ title: "Not Found", message: `Could not find OWS with Word/ID: ${searchEditId}`, variant: "error" });
            setFormData(initialFormState); // Reset if not found
        } finally {
            setIsFetchingEdit(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (jsonError) {
            showToast({ title: "Validation Error", message: "Fix JSON errors before updating.", variant: "error" });
            return;
        }

        setIsSubmitting(true);
        try {
             const payload = {
                ...formData,
                exam_year: parseInt(formData.exam_year) || null,
                usage_sentences: JSON.parse(formData.usage_sentences)
            };

            await updateMutation.mutateAsync(payload);
            showToast({ title: "Update Success", message: "OWS updated successfully.", variant: "success" });
            setSearchEditId('');
            setFormData(initialFormState);
            setMode('single'); // Return to single upload mode
        } catch (error: any) {
            console.error("Update Error:", error);
            showToast({ title: "Update Failed", message: error.message || "Failed to update OWS.", variant: "error" });
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
                    <ShieldAlert className="w-6 h-6 text-indigo-500" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300">
                        OWS Upload Center
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
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
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
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
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
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Pencil className="w-4 h-4" />
                    Edit OWS
                </button>
                <button
                    onClick={() => setMode('bulk-update')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        mode === 'bulk-update'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
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
                                <FileText className="w-5 h-5 text-indigo-500" />
                                Single OWS Upload
                            </h2>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1.5">
                                <Save className="w-3 h-3" /> Auto-saving draft
                            </span>
                        </div>

                        {/* Top Meta Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">v1_id (Optional)</label>
                                <input name="v1_id" value={formData.v1_id} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-base" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source PDF</label>
                                <input required name="source_pdf" value={formData.source_pdf} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-base" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Year</label>
                                <input required type="number" name="exam_year" value={formData.exam_year} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-base" />
                            </div>
                        </div>

                        {/* Core Word Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Word</label>
                                <input required name="word" value={formData.word} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-base font-bold text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Part of Speech (POS)</label>
                                <select required name="pos" value={formData.pos} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="Noun">Noun</option>
                                    <option value="Verb">Verb</option>
                                    <option value="Adjective">Adjective</option>
                                    <option value="Adverb">Adverb</option>
                                    <option value="Phrase">Phrase</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meaning (English)</label>
                                <textarea required name="meaning_english" value={formData.meaning_english} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-base" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meaning (Hindi)</label>
                                <textarea required name="meaning_hindi" value={formData.meaning_hindi} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-base" />
                            </div>
                        </div>

                        {/* Properties */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                                <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>

                        {/* Usage Sentences JSON */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Usage Sentences JSON Array</label>
                                {jsonError && <span className="text-xs text-red-500 font-medium">Invalid JSON</span>}
                                {!jsonError && <span className="text-xs text-indigo-500 font-medium">Valid JSON</span>}
                            </div>
                            <textarea
                                required
                                name="usage_sentences"
                                value={formData.usage_sentences}
                                onChange={handleChange}
                                rows={4}
                                className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 transition-shadow resize-y ${jsonError ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-indigo-500'}`}
                            />
                            {jsonError && <p className="text-xs text-red-500 mt-1">{jsonError}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !!jsonError}
                            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {isSubmitting ? 'Uploading to Database...' : 'Upload OWS'}
                        </button>
                    </form>
                )}

                {/* --- BULK UPLOAD MODE --- */}
                {mode === 'bulk' && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileJson className="w-5 h-5 text-indigo-500" />
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
                                placeholder='[\n  {\n    "word": "Atheist",\n    "pos": "Noun",\n    "meaning_english": "A person who disbelieves or lacks belief in the existence of God or gods.",\n    "meaning_hindi": "नास्तिक",\n    "usage_sentences": ["He is a committed atheist."],\n    "source_pdf": "SSC CGL 2023",\n    "exam_year": 2023\n  }\n]'
                                rows={15}
                                className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-4 py-4 outline-none focus:ring-2 transition-shadow resize-y shadow-inner ${bulkJson && !bulkValidation.isValid ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-indigo-500'}`}
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
                                        <div className="text-2xl font-black text-indigo-500">{duplicateCheck.newCount}</div>
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">New To Upload</div>
                                    </div>
                                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm opacity-70">
                                        <div className="text-2xl font-black text-orange-500">{duplicateCheck.duplicateCount}</div>
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Duplicates Skipped</div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleBulkUpload}
                                    disabled={duplicateCheck.newCount === 0 || isSubmitting}
                                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                    {isSubmitting ? 'Inserting...' : `Upload ${duplicateCheck.newCount} Valid OWS`}
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
                                <Pencil className="w-5 h-5 text-indigo-500" />
                                Edit Existing OWS
                            </h2>
                        </div>

                        {/* Search Fetch Form */}
                        <form onSubmit={handleFetchEdit} className="flex gap-3">
                            <input
                                type="text"
                                value={searchEditId}
                                onChange={(e) => setSearchEditId(e.target.value)}
                                placeholder="Enter Word or v1_id to edit..."
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
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

                                {/* Top Meta Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">v1_id (Optional)</label>
                                        <input name="v1_id" value={formData.v1_id} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-base" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source PDF</label>
                                        <input required name="source_pdf" value={formData.source_pdf} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-base" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Year</label>
                                        <input required type="number" name="exam_year" value={formData.exam_year} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-base" />
                                    </div>
                                </div>

                                {/* Core Word Data */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Word</label>
                                        <input required name="word" value={formData.word} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-base font-bold text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Part of Speech (POS)</label>
                                        <select required name="pos" value={formData.pos} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                                            <option value="Noun">Noun</option>
                                            <option value="Verb">Verb</option>
                                            <option value="Adjective">Adjective</option>
                                            <option value="Adverb">Adverb</option>
                                            <option value="Phrase">Phrase</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meaning (English)</label>
                                        <textarea required name="meaning_english" value={formData.meaning_english} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-base" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meaning (Hindi)</label>
                                        <textarea required name="meaning_hindi" value={formData.meaning_hindi} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-base" />
                                    </div>
                                </div>

                                {/* Properties */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                                        <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                        <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Usage Sentences JSON */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Usage Sentences JSON Array</label>
                                        {jsonError && <span className="text-xs text-red-500 font-medium">Invalid JSON</span>}
                                        {!jsonError && <span className="text-xs text-indigo-500 font-medium">Valid JSON</span>}
                                    </div>
                                    <textarea
                                        required
                                        name="usage_sentences"
                                        value={formData.usage_sentences}
                                        onChange={handleChange}
                                        rows={4}
                                        className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 transition-shadow resize-y ${jsonError ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-indigo-500'}`}
                                    />
                                    {jsonError && <p className="text-xs text-red-500 mt-1">{jsonError}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !!jsonError}
                                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {isSubmitting ? 'Updating Database...' : 'Update OWS Record'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* --- BULK UPDATE MODE --- */}
                {mode === 'bulk-update' && <AdminBulkUpdateOWS />}

            </motion.div>
        </div>
    );
};
