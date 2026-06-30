import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Bell, Upload, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth';

export const AdminHomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Strict Guard
    useEffect(() => {
        if (!user || user.email !== 'admin@mindflow.com') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    if (!user || user.email !== 'admin@mindflow.com') return null;

    return (
        <div className="min-h-screen pt-4 pb-24 px-4 w-full flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 relative z-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-red-500" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 dark:from-red-400 dark:to-red-300">
                        Control Room
                    </h1>
                </div>
                <div className="w-10"></div>
            </header>

            <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col gap-6">

                {/* Reports Queue Button */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/admin/reports')}
                    className="relative group cursor-pointer rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-2xl">
                            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Reports Queue</h2>
                            <p className="text-sm text-slate-500 mt-1">Review user reports and take moderation actions.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Broadcast Button */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/admin/notifications')}
                    className="relative group cursor-pointer rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-2xl">
                            <Bell className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Broadcast Notifications</h2>
                            <p className="text-sm text-slate-500 mt-1">Send global or specific notifications to users.</p>
                        </div>
                    </div>
                </motion.div>


                {/* Upload GK Question Button */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/admin/uploadgk')}
                    className="relative group cursor-pointer rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-2xl">
                            <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Upload GK Question</h2>
                            <p className="text-sm text-slate-500 mt-1">Add GK Questions to the Questions DB (Single & Bulk).</p>
                        </div>
                    </div>
                </motion.div>

                {/* Upload OWS Button */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/admin/upload-ows')}
                    className="relative group cursor-pointer rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-2xl">
                            <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Upload OWS</h2>
                            <p className="text-sm text-slate-500 mt-1">Add One Word Substitutions to the DB (Single & Bulk).</p>
                        </div>
                    </div>
                </motion.div>

                {/* Upload Idioms Button */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/admin/upload-idioms')}
                    className="relative group cursor-pointer rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-amber-100 dark:bg-amber-900/50 p-4 rounded-2xl">
                            <Upload className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Upload Idioms</h2>
                            <p className="text-sm text-slate-500 mt-1">Add Idioms & Phrases to the DB (Single & Bulk).</p>
                        </div>
                    </div>
                </motion.div>

                {/* Upload Synonyms Button */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/admin/upload-synonyms')}
                    className="relative group cursor-pointer rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-cyan-100 dark:bg-cyan-900/50 p-4 rounded-2xl">
                            <Upload className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Upload Synonyms</h2>
                            <p className="text-sm text-slate-500 mt-1">Add Synonyms & Vocab to the DB (Single & Bulk).</p>
                        </div>
                    </div>
                </motion.div>




                {/* Upload Database Button */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/admin/upload')}
                    className="relative group cursor-pointer rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-cyan-100 dark:bg-cyan-900/50 p-4 rounded-2xl">
                            <Upload className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Upload Study Materials</h2>
                            <p className="text-sm text-slate-500 mt-1">Add direct PDFs to Supabase Bucket & DB.</p>
                        </div>
                    </div>
                </motion.div>


                {/* Manage Database Button */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/admin/materials')}
                    className="relative group cursor-pointer rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-purple-100 dark:bg-purple-900/50 p-4 rounded-2xl">
                            <ShieldAlert className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manage Materials</h2>
                            <p className="text-sm text-slate-500 mt-1">Edit or Delete existing PDFs from DB.</p>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};
