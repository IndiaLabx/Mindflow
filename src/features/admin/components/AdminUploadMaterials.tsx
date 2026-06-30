import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNotificationStore } from '@/stores/useNotificationStore';

const CLASSES = ['Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X', 'Class XI', 'Class XII'];
const TYPES = ['NCERT Textbook', 'Study Notes', 'MCQ Test', 'Chapter Test', 'Other Test', 'Answer Key'];

export const AdminUploadMaterials: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useNotificationStore();

    const [file, setFile] = useState<File | null>(null);
    const [selectedClass, setSelectedClass] = useState<string>(CLASSES[3]); // Default IX
    const [selectedType, setSelectedType] = useState<string>(TYPES[1]);
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [title, setTitle] = useState('');

    const [existingSubjects, setExistingSubjects] = useState<string[]>([]);
    const [existingChapters, setExistingChapters] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Guard
    useEffect(() => {
        if (!user || user.email !== 'admin@mindflow.com') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    // Fetch existing metadata to enforce consistency
    useEffect(() => {
        const fetchMetadata = async () => {
            const { data } = await supabase.from('study_materials').select('subject, chapter');
            if (data) {
                const subjs = Array.from(new Set(data.map(d => d.subject))).sort();
                const chaps = Array.from(new Set(data.map(d => d.chapter))).sort();
                setExistingSubjects(subjs);
                setExistingChapters(chaps);
            }
        };
        fetchMetadata();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !subject || !chapter || !title) {
            showToast({ title: 'Error', message: 'Please fill all fields and select a file.', variant: 'error' });
            return;
        }

        setIsUploading(true);

        try {
            // 1. Upload to Supabase Storage Bucket
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${selectedClass}/${subject}/${fileName}`; // Organized structure

            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('study_materials')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('study_materials')
                .getPublicUrl(filePath, { download: true });

            // 3. Insert into Database
            const { error: dbError } = await supabase
                .from('study_materials')
                .insert({
                    class: selectedClass,
                    subject: subject.trim(),
                    chapter: chapter.trim(),
                    type: selectedType,
                    title: title.trim(),
                    file_url: publicUrl,
                    status: true
                });

            if (dbError) throw dbError;

            showToast({ title: 'Success', message: 'File uploaded and database updated!', variant: 'success' });

            // Reset form
            setFile(null);
            setTitle('');
            // Keep class, subject, chapter for quick consecutive uploads
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error: any) {
            console.error('Upload error:', error);
            showToast({ title: 'Upload Failed', message: error.message || 'Unknown error occurred.', variant: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    if (!user || user.email !== 'admin@mindflow.com') return null;

    return (
        <div className="min-h-screen pt-4 pb-24 px-4 w-full flex flex-col relative bg-slate-50 dark:bg-slate-950 overflow-y-auto">
            <header className="flex items-center justify-between mb-6 relative z-10">
                <button onClick={() => navigate('/admin')} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <UploadCloud className="w-6 h-6 text-cyan-500" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-500">
                        Upload Material
                    </h1>
                </div>
                <div className="w-10"></div>
            </header>

            <form onSubmit={handleUpload} className="w-full max-w-lg mx-auto flex flex-col gap-5 relative z-10">

                {/* Fixed Dropdowns for strict consistency */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Material Type</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* Subject Input with Datalist */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject</label>
                    <input
                        type="text"
                        list="subjects-list"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Science"
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <datalist id="subjects-list">
                        {existingSubjects.map(s => <option key={s} value={s} />)}
                    </datalist>
                </div>

                {/* Chapter Input with Datalist */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chapter</label>
                    <input
                        type="text"
                        list="chapters-list"
                        value={chapter}
                        onChange={(e) => setChapter(e.target.value)}
                        placeholder="e.g. Ch-1: Matter"
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <datalist id="chapters-list">
                        {existingChapters.map(c => <option key={c} value={c} />)}
                    </datalist>
                </div>

                {/* Title Input */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Display Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Science Revision Notes"
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                </div>

                {/* File Upload */}
                <div className="flex flex-col gap-1 mt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">PDF File</label>
                    <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group overflow-hidden">
                        <input
                            id="file-upload"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-base"
                        />
                        {file ? (
                            <div className="flex flex-col items-center text-center">
                                <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{file.name}</span>
                                <span className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center">
                                <UploadCloud className="w-10 h-10 text-cyan-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tap to select PDF</span>
                                <span className="text-xs text-slate-500 mt-1">or drag & drop</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isUploading}
                    className="mt-4 w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-lg shadow-lg hover:shadow-cyan-500/30 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:active:scale-100"
                 aria-label="Submit search">
                    {isUploading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Uploading...
                        </>
                    ) : (
                        'Upload to Database'
                    )}
                </button>
            </form>
        </div>
    );
};
