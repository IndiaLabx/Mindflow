import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Upload, ArrowLeft, ShieldAlert, FileJson, FileText, CheckCircle,
    XCircle, AlertTriangle, Loader2, Save, Trash2, Settings, Pencil
} from 'lucide-react';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useFetchQuestionsByIds, useInsertQuestions, useFetchQuestionByV1Id, useUpdateQuestion } from '../hooks/useAdminUploadGK';
import { useNotification } from '../../../hooks/useNotification';
import { AdminBulkUpdate } from './AdminBulkUpdate';

// --- Types ---
type UploadMode = 'single' | 'bulk' | 'edit' | 'bulk-update';

interface QuestionForm {
    id?: string;
    v1_id: string;
    subject: string;
    topic: string;
    subTopic: string;
    examName: string;
    examYear: string;
    examDateShift: string;
    difficulty: string;
    questionType: string;
    question: string;
    question_hi: string;
    options: string;
    options_hi: string;
    correct: string;
    tags: string;
    explanation: string;
}

// Default initial state
const defaultForm: QuestionForm = {
    v1_id: '', subject: '', topic: '', subTopic: '',
    examName: '', examYear: '', examDateShift: '', difficulty: 'Medium',
    questionType: 'MCQ', question: '', question_hi: '',
    options: '["Option A", "Option B", "Option C", "Option D"]',
    options_hi: '["विकल्प ए", "विकल्प बी", "विकल्प सी", "विकल्प डी"]',
    correct: '', tags: 'tag1, tag2',
    explanation: '{\n  "fact": "",\n  "summary": "",\n  "conclusion": "",\n  "analysis_correct": "",\n  "analysis_incorrect": ""\n}'
};

// --- Main Component ---
export const AdminUploadGK: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useNotification();
    const fetchIdsMutation = useFetchQuestionsByIds();
    const insertMutation = useInsertQuestions();
    const fetchEditMutation = useFetchQuestionByV1Id();
    const updateMutation = useUpdateQuestion();

    // Auth Guard
    useEffect(() => {
        if (!user || user.email !== 'admin@mindflow.com') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const [mode, setMode] = useState<UploadMode>('single');

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
                    <ShieldAlert className="w-6 h-6 text-emerald-500" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-300">
                        GK Upload Center
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
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
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
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <FileJson className="w-4 h-4" />
                    Bulk JSON Upload
                </button>
                <button
                    onClick={() => setMode('edit')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        mode === 'edit'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Pencil className="w-4 h-4" />
                    Edit Question
                </button>
                <button
                    onClick={() => setMode('bulk-update')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        mode === 'bulk-update'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    Bulk Update
                </button>
            </div>


            {/* Content Area */}
            <div className="relative z-10 w-full max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                {mode === 'bulk-update' && (
                    <motion.div
                        key="bulk-update"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-4xl mx-auto"
                    >
                        <AdminBulkUpdate />
                    </motion.div>
                )}
                    {mode === 'single' ? (
                        <SingleUpload key="single" />
                    ) : mode === 'bulk' ? (
                        <BulkUpload key="bulk" />
                    ) : (
                        <EditQuestion key="edit" />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// ==========================================
// SINGLE UPLOAD COMPONENT
// ==========================================
const SingleUpload: React.FC = () => {
    const { showToast } = useNotification();
    const fetchIdsMutation = useFetchQuestionsByIds();
    const insertMutation = useInsertQuestions();
    const fetchEditMutation = useFetchQuestionByV1Id();
    const updateMutation = useUpdateQuestion();
    const [formData, setFormData] = useState<QuestionForm>(() => {
        const saved = localStorage.getItem('gk_upload_draft');
        return saved ? JSON.parse(saved) : defaultForm;
    });

    const [isCheckingV1Id, setIsCheckingV1Id] = useState(false);
    const [v1IdStatus, setV1IdStatus] = useState<'idle' | 'available' | 'taken'>('idle');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-save
    useEffect(() => {
        localStorage.setItem('gk_upload_draft', JSON.stringify(formData));
    }, [formData]);

    // Check v1_id uniqueness
    useEffect(() => {
        const checkV1Id = async () => {
            if (!formData.v1_id || formData.v1_id.trim() === '') {
                setV1IdStatus('idle');
                return;
            }
            setIsCheckingV1Id(true);
            try {
                const data = await fetchIdsMutation.mutateAsync([formData.v1_id]);
                setV1IdStatus(data && data.length > 0 ? 'taken' : 'available');
            } catch (err) {
                console.error("Error checking v1_id:", err);
            } finally {
                setIsCheckingV1Id(false);
            }
        };

        const timer = setTimeout(checkV1Id, 500); // Debounce
        return () => clearTimeout(timer);
    }, [formData.v1_id]);

    // JSON Validation for Explanation
    useEffect(() => {
        try {
            JSON.parse(formData.explanation);
            setJsonError(null);
        } catch (e: any) {
            setJsonError(e.message);
        }
    }, [formData.explanation]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        if (confirm('Clear all fields?')) {
            setFormData(defaultForm);
            localStorage.removeItem('gk_upload_draft');
        }
    };

    const validateArrayInput = (input: string) => {
        try {
            const parsed = JSON.parse(input);
            if (!Array.isArray(parsed)) throw new Error("Must be a JSON array.");
            return parsed;
        } catch (e) {
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validations
        if (v1IdStatus === 'taken') {
            showToast({ title: 'Error', message: 'v1_id is already taken.', variant: 'error' });
            return;
        }
        if (jsonError) {
            showToast({ title: 'Error', message: 'Explanation JSON is invalid.', variant: 'error' });
            return;
        }

        const options = validateArrayInput(formData.options);
        if (!options) {
            showToast({ title: 'Error', message: 'Options must be a valid JSON array like ["A","B"]', variant: 'error' });
            return;
        }

        const options_hi = validateArrayInput(formData.options_hi);
        if (!options_hi) {
            showToast({ title: 'Error', message: 'Hindi Options must be a valid JSON array.', variant: 'error' });
            return;
        }

        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '');

        setIsSubmitting(true);

        const payload = {
            v1_id: formData.v1_id,
            subject: formData.subject,
            topic: formData.topic,
            subTopic: formData.subTopic,
            examName: formData.examName,
            examYear: parseInt(formData.examYear, 10),
            examDateShift: formData.examDateShift,
            difficulty: formData.difficulty,
            questionType: formData.questionType,
            question: formData.question,
            question_hi: formData.question_hi,
            options: options,
            options_hi: options_hi,
            correct: formData.correct,
            tags: tagsArray,
            explanation: JSON.parse(formData.explanation),
        };

        try {
            await insertMutation.mutateAsync([payload]);

            showToast({ title: 'Success', message: 'Question uploaded successfully.', variant: 'success' });
            setFormData(defaultForm);
            localStorage.removeItem('gk_upload_draft');
        } catch (err: any) {
            console.error(err);
            showToast({ title: 'Upload Failed', message: err.message, variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8"
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    Single Question Upload
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Save className="w-3 h-3" /> Auto-saving draft
                    </span>
                    <button onClick={handleClear} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" aria-label="Clear input">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ID & Classification Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">v1_id</label>
                        <div className="relative">
                            <input required name="v1_id" value={formData.v1_id} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                            <div className="absolute right-3 top-2.5">
                                {isCheckingV1Id ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> :
                                 v1IdStatus === 'available' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                                 v1IdStatus === 'taken' ? <XCircle className="w-4 h-4 text-red-500" /> : null}
                            </div>
                        </div>
                        {v1IdStatus === 'taken' && <p className="text-xs text-red-500 mt-1">ID Already Exists!</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                        <input required name="subject" value={formData.subject} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic</label>
                        <input required name="topic" value={formData.topic} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sub-Topic</label>
                        <input required name="subTopic" value={formData.subTopic} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                    </div>
                </div>

                {/* Exam Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Name</label>
                        <input required name="examName" value={formData.examName} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Year</label>
                        <input required type="number" name="examYear" value={formData.examYear} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Date & Shift</label>
                        <input required name="examDateShift" value={formData.examDateShift} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                    </div>
                </div>

                {/* Question Properties */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                        <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Question Type</label>
                        <input required name="questionType" value={formData.questionType} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (Comma Separated)</label>
                        <input required name="tags" value={formData.tags} onChange={handleChange} placeholder="Biology, Genetics" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Question (English)</label>
                        <textarea required name="question" value={formData.question} onChange={handleChange} rows={4} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-base" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Question (Hindi)</label>
                        <textarea required name="question_hi" value={formData.question_hi} onChange={handleChange} rows={4} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-base" />
                    </div>
                </div>

                {/* Options & Correct */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Options (JSON Array)</label>
                        <textarea required name="options" value={formData.options} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-base" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Options Hindi (JSON Array)</label>
                        <textarea required name="options_hi" value={formData.options_hi} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-base" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correct Answer (Exact Match)</label>
                    <input required name="correct" value={formData.correct} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                </div>

                {/* Smart JSON Textarea */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Explanation JSON</label>
                        {jsonError && <span className="text-xs text-red-500 font-medium">Invalid JSON</span>}
                        {!jsonError && <span className="text-xs text-emerald-500 font-medium">Valid JSON</span>}
                    </div>
                    <textarea
                        required
                        name="explanation"
                        value={formData.explanation}
                        onChange={handleChange}
                        rows={10}
                        className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 transition-shadow resize-y ${jsonError ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-emerald-500'}`}
                    />
                    {jsonError && <p className="text-xs text-red-500 mt-1 mt-1">{jsonError}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || v1IdStatus === 'taken' || !!jsonError}
                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {isSubmitting ? 'Uploading to DB...' : 'Upload Question'}
                </button>
            </form>
        </motion.div>
    );
};


// ==========================================
// BULK UPLOAD COMPONENT
// ==========================================
const BulkUpload: React.FC = () => {
    const { showToast } = useNotification();
    const fetchIdsMutation = useFetchQuestionsByIds();
    const insertMutation = useInsertQuestions();
    const fetchEditMutation = useFetchQuestionByV1Id();
    const updateMutation = useUpdateQuestion();
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewData, setPreviewData] = useState<any[] | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [validCount, setValidCount] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setPreviewData(null);
            setErrors([]);
            setValidCount(0);
        }
    };

    const processFile = async () => {
        if (!file) return;
        setIsProcessing(true);
        setErrors([]);
        setPreviewData(null);

        try {
            const text = await file.text();
            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (e: any) {
                throw new Error("Invalid JSON File: " + e.message);
            }

            if (!Array.isArray(parsed)) {
                throw new Error("JSON root must be an array of objects.");
            }

            const flattenedData: any[] = [];
            const currentErrors: string[] = [];
            const v1IdsToFetch: string[] = [];

            // 1. Structural Validation and Flattening
            parsed.forEach((item, index) => {
                const qNum = index + 1;
                const flatItem: any = {};

                // Map Nested to Flat
                try {
                    // IDs
                    if (!item.id) currentErrors.push(`Q${qNum}: Missing 'id'`);
                    else { flatItem.v1_id = String(item.id); v1IdsToFetch.push(flatItem.v1_id); }

                    // Source Info
                    if (!item.sourceInfo) currentErrors.push(`Q${qNum}: Missing 'sourceInfo'`);
                    else {
                        flatItem.examName = item.sourceInfo.examName || '';
                        flatItem.examYear = Number(item.sourceInfo.examYear) || 0;
                        flatItem.examDateShift = item.sourceInfo.examDateShift || '';
                    }

                    // Classification
                    if (!item.classification) currentErrors.push(`Q${qNum}: Missing 'classification'`);
                    else {
                        flatItem.subject = (item.subject ?? item.classification?.subject) || '';
                        flatItem.topic = item.classification.topic || '';
                        flatItem.subTopic = item.classification.subTopic || '';
                    }

                    // Tags
                    if (!Array.isArray(item.tags)) currentErrors.push(`Q${qNum}: 'tags' must be an array`);
                    else flatItem.tags = item.tags;

                    // Properties
                    if (!item.properties) currentErrors.push(`Q${qNum}: Missing 'properties'`);
                    else {
                        flatItem.difficulty = (item.difficulty ?? item.properties?.difficulty) || '';
                        flatItem.questionType = (item.questionType ?? item.properties?.questionType) || '';
                    }

                    // Root strings
                    flatItem.question = item.question || '';
                    flatItem.question_hi = item.question_hi || '';
                    flatItem.correct = item.correct || '';

                    // Options arrays
                    if (!Array.isArray(item.options)) currentErrors.push(`Q${qNum}: 'options' must be an array`);
                    else flatItem.options = item.options;

                    if (!Array.isArray(item.options_hi)) currentErrors.push(`Q${qNum}: 'options_hi' must be an array`);
                    else flatItem.options_hi = item.options_hi;

                    // Explanation JSON
                    if (!item.explanation || typeof item.explanation !== 'object') currentErrors.push(`Q${qNum}: 'explanation' must be an object`);
                    else flatItem.explanation = item.explanation;

                    // Check for empty required fields (basic check)
                    const requiredKeys = ['v1_id', 'subject', 'topic', 'subTopic', 'examName', 'question', 'correct'];
                    requiredKeys.forEach(k => {
                        if (!flatItem[k]) currentErrors.push(`Q${qNum}: Field '${k}' is empty or missing`);
                    });

                    flattenedData.push(flatItem);

                } catch (e: any) {
                    currentErrors.push(`Q${qNum}: Processing error - ${e.message}`);
                }
            });

            // 2. Duplicate v1_id Check (Supabase)
            if (currentErrors.length === 0 && v1IdsToFetch.length > 0) {
                const data = await fetchIdsMutation.mutateAsync(v1IdsToFetch);

                if (data && data.length > 0) {
                    const existingIds = data.map(d => d.v1_id);
                    existingIds.forEach(id => {
                        currentErrors.push(`Database Error: v1_id '${id}' already exists in the database.`);
                    });
                }

                // Check local duplicates in the JSON itself
                const localIds = new Set();
                v1IdsToFetch.forEach(id => {
                    if (localIds.has(id)) currentErrors.push(`JSON Error: Duplicate v1_id '${id}' found within the file.`);
                    localIds.add(id);
                });
            }

            setErrors(currentErrors);
            if (currentErrors.length === 0) {
                setPreviewData(flattenedData);
                setValidCount(flattenedData.length);
            }

        } catch (err: any) {
            setErrors([err.message]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUploadBulk = async () => {
        if (!previewData || previewData.length === 0 || errors.length > 0) return;

        setIsUploading(true);
        try {
            // Batch insert
            await insertMutation.mutateAsync(previewData);

            showToast({ title: 'Success', message: `Successfully uploaded ${previewData.length} questions.`, variant: 'success' });
            setFile(null);
            setPreviewData(null);
            setValidCount(0);
        } catch (err: any) {
            console.error(err);
            showToast({ title: 'Upload Failed', message: err.message, variant: 'error' });
            setErrors([`Upload Error: ${err.message}`]);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8"
        >
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileJson className="w-5 h-5 text-emerald-500" />
                    Bulk JSON Upload
                </h2>
                <p className="text-sm text-slate-500 mt-1">Upload the nested JSON format. The adapter will flatten it and verify everything.</p>
            </div>

            {/* File Input */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                <Upload className="w-10 h-10 text-slate-400 mb-4" />
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="block w-full max-w-sm text-base text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-base file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400 cursor-pointer"
                />
            </div>

            {file && !previewData && errors.length === 0 && (
                <div className="mt-6">
                    <button
                        onClick={processFile}
                        disabled={isProcessing}
                        className="w-full py-4 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings className="w-5 h-5" />}
                        {isProcessing ? 'Validating & Flattening...' : 'Validate File'}
                    </button>
                </div>
            )}

            {/* Error Report */}
            {errors.length > 0 && (
                <div className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50">
                    <h3 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2 mb-3">
                        <XCircle className="w-5 h-5" />
                        Validation Failed ({errors.length} Errors)
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">Please fix these errors in your JSON file and select it again. The entire file is blocked until 100% valid.</p>
                    <div className="max-h-64 overflow-y-auto space-y-1 p-3 bg-white dark:bg-slate-900 rounded-xl font-mono text-xs text-red-600 dark:text-red-400">
                        {errors.map((err, i) => (
                            <div key={i} className="py-1 border-b border-red-100 dark:border-red-900/30 last:border-0">{err}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* Success Preview */}
            {previewData && errors.length === 0 && (
                <div className="mt-6 space-y-6">
                    <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                        <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Validation Passed!</h3>
                        <p className="text-emerald-600 dark:text-emerald-500 mt-1">Successfully flattened and verified {validCount} questions. No duplicate v1_ids found in the database.</p>
                    </div>

                    <button
                        onClick={handleUploadBulk}
                        disabled={isUploading}
                        className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        {isUploading ? 'Uploading to Database...' : `Upload All ${validCount} Questions`}
                    </button>
                </div>
            )}
        </motion.div>
    );
};

// ==========================================
// EDIT QUESTION COMPONENT
// ==========================================
const EditQuestion: React.FC = () => {
    const { showToast } = useNotification();
    const fetchIdsMutation = useFetchQuestionsByIds();
    const insertMutation = useInsertQuestions();
    const fetchEditMutation = useFetchQuestionByV1Id();
    const updateMutation = useUpdateQuestion();
    const [searchId, setSearchId] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const [formData, setFormData] = useState<QuestionForm | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // JSON Validation for Explanation
    useEffect(() => {
        if (!formData) return;
        try {
            JSON.parse(formData.explanation);
            setJsonError(null);
        } catch (e: any) {
            setJsonError(e.message);
        }
    }, [formData?.explanation]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId.trim()) return;

        setIsSearching(true);
        setFormData(null);
        try {
            const q = await fetchEditMutation.mutateAsync(searchId.trim());

            if (q) {
                setFormData({
                    id: q.id,
                    v1_id: q.v1_id,
                    subject: q.subject || '',
                    topic: q.topic || '',
                    subTopic: q.subTopic || '',
                    examName: q.examName || '',
                    examYear: q.examYear ? q.examYear.toString() : '',
                    examDateShift: q.examDateShift || '',
                    difficulty: q.difficulty || 'Medium',
                    questionType: q.questionType || 'MCQ',
                    question: q.question || '',
                    question_hi: q.question_hi || '',
                    options: q.options ? JSON.stringify(q.options) : '[]',
                    options_hi: q.options_hi ? JSON.stringify(q.options_hi) : '[]',
                    correct: q.correct || '',
                    tags: q.tags && Array.isArray(q.tags) ? q.tags.join(', ') : '',
                    explanation: q.explanation ? JSON.stringify(q.explanation, null, 2) : '{}'
                });
                showToast({ title: 'Found', message: `Question ${q.v1_id} loaded.`, variant: 'info' });
            } else {
                showToast({ title: 'Not Found', message: `No question found with v1_id: ${searchId}`, variant: 'error' });
            }
        } catch (err: any) {
            console.error(err);
            showToast({ title: 'Search Failed', message: err.message, variant: 'error' });
        } finally {
            setIsSearching(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!formData) return;
        const { name, value } = e.target;
        setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const validateArrayInput = (input: string) => {
        try {
            const parsed = JSON.parse(input);
            if (!Array.isArray(parsed)) throw new Error("Must be a JSON array.");
            return parsed;
        } catch (e) {
            return null;
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        // Validations
        if (jsonError) {
            showToast({ title: 'Error', message: 'Explanation JSON is invalid.', variant: 'error' });
            return;
        }

        const options = validateArrayInput(formData.options);
        if (!options) {
            showToast({ title: 'Error', message: 'Options must be a valid JSON array like ["A","B"]', variant: 'error' });
            return;
        }

        const options_hi = validateArrayInput(formData.options_hi);
        if (!options_hi) {
            showToast({ title: 'Error', message: 'Hindi Options must be a valid JSON array.', variant: 'error' });
            return;
        }

        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '');

        setIsSubmitting(true);

        const payload = {
            id: formData.id,
            v1_id: formData.v1_id,
            subject: formData.subject,
            topic: formData.topic,
            subTopic: formData.subTopic,
            examName: formData.examName,
            examYear: parseInt(formData.examYear, 10),
            examDateShift: formData.examDateShift,
            difficulty: formData.difficulty,
            questionType: formData.questionType,
            question: formData.question,
            question_hi: formData.question_hi,
            options: options,
            options_hi: options_hi,
            correct: formData.correct,
            tags: tagsArray,
            explanation: JSON.parse(formData.explanation),
        };

        try {
            await updateMutation.mutateAsync(payload);

            showToast({ title: 'Success', message: 'Question updated successfully.', variant: 'success' });
            setFormData(null); // Clear form after success
            setSearchId('');
        } catch (err: any) {
            console.error(err);
            showToast({ title: 'Update Failed', message: err.message || 'Failed to update question', variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8"
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-emerald-500" />
                    Edit Question Database
                </h2>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8 flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter v1_id (e.g. POL72)"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                />
                <button
                    type="submit"
                    disabled={isSearching}
                    className="px-6 py-3 sm:py-0 w-full sm:w-auto justify-center rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all disabled:opacity-50 flex items-center gap-2"
                 aria-label="Submit search">
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                </button>
            </form>

            {/* Edit Form */}
            {formData && (
                <form onSubmit={handleUpdate} className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">

                    {/* ID & Classification Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">v1_id</label>
                            <input name="v1_id" value={formData.v1_id} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                            <input required name="subject" value={formData.subject} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic</label>
                            <input required name="topic" value={formData.topic} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sub-Topic</label>
                            <input required name="subTopic" value={formData.subTopic} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                        </div>
                    </div>

                    {/* Exam Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Name</label>
                            <input required name="examName" value={formData.examName} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Year</label>
                            <input required type="number" name="examYear" value={formData.examYear} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Date & Shift</label>
                            <input required name="examDateShift" value={formData.examDateShift} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                        </div>
                    </div>

                    {/* Question Properties */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                            <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Question Type</label>
                            <input required name="questionType" value={formData.questionType} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (Comma Separated)</label>
                            <input required name="tags" value={formData.tags} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Question (English)</label>
                            <textarea required name="question" value={formData.question} onChange={handleChange} rows={4} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-base" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Question (Hindi)</label>
                            <textarea required name="question_hi" value={formData.question_hi} onChange={handleChange} rows={4} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-base" />
                        </div>
                    </div>

                    {/* Options & Correct */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Options (JSON Array)</label>
                            <textarea required name="options" value={formData.options} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-base" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Options Hindi (JSON Array)</label>
                            <textarea required name="options_hi" value={formData.options_hi} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-base" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correct Answer (Exact Match)</label>
                        <input required name="correct" value={formData.correct} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                    </div>

                    {/* Smart JSON Textarea */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Explanation JSON</label>
                            {jsonError && <span className="text-xs text-red-500 font-medium">Invalid JSON</span>}
                            {!jsonError && <span className="text-xs text-emerald-500 font-medium">Valid JSON</span>}
                        </div>
                        <textarea
                            required
                            name="explanation"
                            value={formData.explanation}
                            onChange={handleChange}
                            rows={15}
                            className={`w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 transition-shadow resize-y ${jsonError ? 'border border-red-500 focus:ring-red-500' : 'border border-slate-700 focus:ring-emerald-500'}`}
                        />
                        {jsonError && <p className="text-xs text-red-500 mt-1">{jsonError}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !!jsonError}
                        className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSubmitting ? 'Updating Database...' : 'Update Question'}
                    </button>
                </form>
            )}
        </motion.div>
    );
};
