import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { AppNotification, NotificationType, NotificationTargetAudience } from '../types';

interface AdminEditNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: AppNotification | null;
    onSuccess: (updatedNotification: AppNotification) => void;
}

export const AdminEditNotificationModal: React.FC<AdminEditNotificationModalProps> = ({ isOpen, onClose, notification, onSuccess }) => {
    const { showToast } = useNotificationStore();
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<AppNotification>>({});

    // Reset form when notification changes
    useEffect(() => {
        if (notification) {
            setFormData({
                title: notification.title,
                message: notification.message,
                type: notification.type,
                target_audience: notification.target_audience,
                link: notification.link || ''
            });
        }
    }, [notification]);

    const handleSave = async () => {
        if (!notification || !formData.title || !formData.message || !formData.type || !formData.target_audience) {
            showToast({ title: 'Error', message: 'All fields except link are required.', variant: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const updatePayload = {
                title: formData.title.trim(),
                message: formData.message.trim(),
                type: formData.type,
                target_audience: formData.target_audience,
                link: formData.link ? formData.link.trim() : null
            };

            const { error, data } = await supabase
                .from('notifications')
                .update(updatePayload)
                .eq('id', notification.id)
                .select();

            if (error) throw error;

            showToast({ title: 'Success', message: 'Notification updated successfully!', variant: 'success' });
            onSuccess(data[0] as AppNotification);
            onClose();
        } catch (error: any) {
            console.error('Update error:', error);
            showToast({ title: 'Error', message: error.message || 'Failed to update notification.', variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !notification) return null;

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
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Notification</h2>
                            <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/50 dark:bg-slate-800/50 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Title</label>
                                <input
                                    type="text"
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Message</label>
                                <textarea
                                    rows={3}
                                    value={formData.message || ''}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</label>
                                    <select
                                        value={formData.type || ''}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationType })}
                                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    >
                                        <option value="announcements">Announcements</option>
                                        <option value="tests_quizzes">Tests & Quizzes</option>
                                        <option value="study_materials">Study Materials</option>
                                        <option value="daily_reminders">Daily Reminders</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Audience</label>
                                    <select
                                        value={formData.target_audience || ''}
                                        onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as NotificationTargetAudience })}
                                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    >
                                        <option value="all">Everyone</option>
                                        <option value="competitive">Competitive Mode Users</option>
                                        <option value="school">School Mode Users</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Action Link (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.link || ''}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="E.g., /tests or https://example.com"
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
