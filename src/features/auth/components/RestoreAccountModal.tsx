import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../../../stores/useNotificationStore';

export const RestoreAccountModal: React.FC = () => {
    const { user, signOut, refreshUser } = useAuth();
    const { showToast } = useNotification();
    const [isRestoring, setIsRestoring] = useState(false);

    // Type assertion to bypass strict typing issues if we modified context manually but TS doesn't see it yet.
    // In our patched context, we have these properties.
    const context = useAuth() as any;
    const isPendingDeletion = context.profileStatus === 'pending_deletion';

    if (!isPendingDeletion || !user) return null;

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            const { error } = await supabase.rpc('restore_account');

            if (error) throw error;

            showToast({
                variant: 'success',
                title: 'Account Restored',
                message: 'Welcome back! Your account has been fully restored.'
            });

            // Force a reload to cleanly rebuild the user state/context
            window.location.reload();

        } catch (error: any) {
            console.error('Error restoring account:', error);
            showToast({
                variant: 'error',
                title: 'Restore Failed',
                message: error.message || 'Failed to restore account. Please try again.'
            });
            setIsRestoring(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6 md:p-8 text-center">
                    <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Account Scheduled for Deletion
                    </h2>

                    <p className="text-slate-600 dark:text-slate-300 mb-8">
                        Your account is currently pending deletion. Do you want to restore your account and cancel the deletion process?
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleRestore}
                            disabled={isRestoring}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRestoring ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            <span>Yes, Restore My Account</span>
                        </button>

                        <button
                            onClick={() => signOut()}
                            disabled={isRestoring}
                            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            No, Sign Me Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
