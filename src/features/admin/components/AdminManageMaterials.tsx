import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, FileText, Loader2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { AdminEditMaterialModal, StudyMaterial } from '@/features/admin/components/AdminEditMaterialModal';
import { deleteStudyMaterial } from '@/features/quiz/utils/adminMaterialUtils';

export const AdminManageMaterials: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useNotificationStore();

    const [materials, setMaterials] = useState<StudyMaterial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Strict Guard
    useEffect(() => {
        if (!user || user.email !== 'admin@mindflow.com') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('study_materials')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMaterials((data as StudyMaterial[]) || []);
        } catch (error) {
            console.error("Error fetching materials:", error);
            showToast({ title: "Error", message: "Failed to load materials.", variant: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (material: StudyMaterial) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${material.title}"?\nThis will remove the database record and the actual PDF file from the bucket.`);
        if (!confirmed) return;

        setDeletingId(material.id);
        try {
            await deleteStudyMaterial(material.id, material.file_url);
            setMaterials(prev => prev.filter(m => m.id !== material.id));
            showToast({ title: "Deleted", message: "Material successfully deleted.", variant: "success" });
        } catch (error: any) {
            showToast({ title: "Error", message: error.message || "Failed to delete material.", variant: "error" });
        } finally {
            setDeletingId(null);
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.class.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <FileText className="w-6 h-6 text-purple-500" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-500">
                        Manage Materials
                    </h1>
                </div>
                <div className="w-10"></div>
            </header>

            <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 relative z-10 h-full">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by title, subject, or class..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                    />
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex-1 flex flex-col min-h-[50vh]">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Loading database...</p>
                        </div>
                    ) : filteredMaterials.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                            <p className="text-slate-500 font-medium text-lg">No materials found.</p>
                            {searchQuery && <p className="text-sm text-slate-400 mt-1">Try a different search term.</p>}
                        </div>
                    ) : (
                        <div className="overflow-y-auto p-4 flex flex-col gap-3">
                            <AnimatePresence>
                                {filteredMaterials.map(material => (
                                    <motion.div
                                        key={material.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:shadow-md"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{material.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                {material.class} • {material.subject} • {material.chapter}
                                            </p>
                                            <div className="inline-block px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold mt-2 border border-purple-200 dark:border-purple-800/50">
                                                {material.type}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => setEditingMaterial(material)}
                                                className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm"
                                                title="Edit Metadata"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(material)}
                                                disabled={deletingId === material.id}
                                                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm disabled:opacity-50"
                                                title="Delete Material"
                                            >
                                                {deletingId === material.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            <AdminEditMaterialModal
                isOpen={!!editingMaterial}
                material={editingMaterial}
                onClose={() => setEditingMaterial(null)}
                onSuccess={ (updated: any)  => {
                    setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
                }}
            />
        </div>
    );
};
