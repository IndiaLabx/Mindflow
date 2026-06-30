import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Trash2, Loader2, Info } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../stores/useNotificationStore';
import { Download } from 'lucide-react';
import { useJSONDownloader } from '../../../hooks/useJSONDownloader';

export const DeleteAccountPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { showToast } = useNotification();
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasDownloadedData, setHasDownloadedData] = useState(false);
    const { downloadJSON, isGenerating } = useJSONDownloader<any>();

    const isConfirmValid = confirmationText === 'DELETE';

    const handleDownloadData = async () => {
        try {
            const { data, error } = await supabase.rpc('export_user_data');
            if (error) throw error;

            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const fileName = `mindflow_userdata_${dateStr}.json`;

            // downloadJSON expects an array of data according to its type definition
            // but for this specific usecase since we have a single object we'll wrap it in array
            // or modify the type if needed. Let's wrap in array to respect the generic signature T[]
            const result = await downloadJSON([data], fileName);

            if (result) {
                // Trigger actual download in browser
                const a = document.createElement('a');
                a.href = result.url;
                a.download = result.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(result.url);

                setHasDownloadedData(true);
                showToast({
                    variant: 'success',
                    title: 'Data Downloaded',
                    message: 'Your data has been successfully exported.'
                });
            }
        } catch (err: any) {
            console.error('Failed to export data:', err);
            showToast({
                variant: 'error',
                title: 'Export Failed',
                message: err.message || 'Could not export your data at this time.'
            });
        }
    };


    const handleDeleteAccount = async () => {
        if (!isConfirmValid || !user) return;

        if (!hasDownloadedData) {
            showToast({
                variant: 'error',
                title: 'Data Not Downloaded',
                message: 'Please download your data before deleting your account.'
            });
            return;
        }

        setIsDeleting(true);
        try {
            // Update profile to mark for deletion
            const { error } = await supabase.rpc('request_account_deletion');

            if (error) throw error;

            showToast({
                variant: 'success',
                title: 'Account Deletion Scheduled',
                message: 'Your account has been scheduled for deletion. You will be logged out now.'
            });

            // Log the user out
            await signOut();
            navigate('/dashboard');

        } catch (error: any) {
            console.error('Error scheduling account deletion:', error);
            showToast({
                variant: 'error',
                title: 'Deletion Failed',
                message: error.message || 'Failed to schedule account deletion. Please try again.'
            });
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 pb-20 pt-4 px-4 animate-in fade-in duration-300">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white">Delete Account</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage your data</p>
                    </div>
                </div>
            </header>

            <div className="max-w-xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden p-6 md:p-8">

                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                            <Trash2 className="w-12 h-12 text-red-600 dark:text-red-500" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-4">
                        Delete Your Account
                    </h2>

                    <div className="space-y-4 mb-8 text-slate-600 dark:text-slate-300">
                        <p>
                            We're sorry to see you go. Before you delete your account, please read the following carefully:
                        </p>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 border border-blue-100 dark:border-blue-900/30">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong className="font-semibold">7-Day Grace Period:</strong> Your account will not be immediately deleted. We will schedule it for deletion in 7 days. If you change your mind within this period, simply log back in to restore your account.
                            </p>
                        </div>

                        <ul className="list-disc pl-5 space-y-2 text-sm mt-4">
                            <li>After 7 days, your account and all associated data will be <strong className="font-bold text-red-600 dark:text-red-400">permanently deleted</strong>.</li>
                            <li>This includes your profile, quiz history, saved materials, bookmarks, and interactions.</li>
                            <li>This action cannot be undone once the 7-day period expires.</li>
                        </ul>
                    </div>


                    <div className="mb-8 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-center">
                        <div className="flex justify-center mb-3">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-full">
                                <Download className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Download Your Data</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Before you delete your account, we highly recommend downloading a copy of your personal data, posts, progress, and interactions.
                        </p>
                        <button
                            onClick={handleDownloadData}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Compiling Data...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    <span>Download My Data</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3" htmlFor="confirm-delete">
                            To proceed, please type <span className="text-red-600 font-bold select-all">DELETE</span> below:
                        </label>
                        <input
                            id="confirm-delete"
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all mb-6 uppercase"
                            autoComplete="off"
                        />

                        <button
                            onClick={handleDeleteAccount}
                            disabled={!isConfirmValid || isDeleting}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all duration-300 ${
                                isConfirmValid
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            }`}
                         aria-label="Delete item">
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Scheduling Deletion...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-5 h-5" />
                                    <span>Schedule Account Deletion</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
