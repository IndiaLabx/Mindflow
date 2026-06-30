import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldAlert, Clock, CheckCircle2, MessageSquare, ShieldBan, ShieldQuestion } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { fetchMyReports } from '../../community/api/reportsApi';
import { cn } from '../../../utils/cn';

export const MyReportsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: reports, isLoading } = useQuery({
        queryKey: ['my-reports', user?.id],
        queryFn: () => fetchMyReports(user!.id),
        enabled: !!user?.id,
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    icon: Clock,
                    label: 'Pending',
                    color: 'text-yellow-600 dark:text-yellow-400',
                    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    border: 'border-yellow-200 dark:border-yellow-800'
                };
            case 'being_reviewed':
                return {
                    icon: ShieldQuestion,
                    label: 'Under Review',
                    color: 'text-blue-600 dark:text-blue-400',
                    bg: 'bg-blue-100 dark:bg-blue-900/30',
                    border: 'border-blue-200 dark:border-blue-800'
                };
            case 'resolved':
                return {
                    icon: CheckCircle2,
                    label: 'Resolved',
                    color: 'text-green-600 dark:text-green-400',
                    bg: 'bg-green-100 dark:bg-green-900/30',
                    border: 'border-green-200 dark:border-green-800'
                };
            case 'ignored':
                return {
                    icon: ShieldBan,
                    label: 'Ignored',
                    color: 'text-slate-600 dark:text-slate-400',
                    bg: 'bg-slate-100 dark:bg-slate-800',
                    border: 'border-slate-200 dark:border-slate-700'
                };
            default:
                return {
                    icon: Clock,
                    label: 'Pending',
                    color: 'text-yellow-600 dark:text-yellow-400',
                    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    border: 'border-yellow-200 dark:border-yellow-800'
                };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center gap-4 max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500" /> My Reports
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 max-w-2xl mx-auto space-y-4 mt-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl p-6 h-40 border border-slate-200 dark:border-slate-800" />
                        ))}
                    </div>
                ) : reports?.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12"
                    >
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Reports Yet</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                            When you report users, you can track the status of those reports here.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {reports?.map((report, index) => {
                            const statusConfig = getStatusConfig(report.status);
                            const StatusIcon = statusConfig.icon;
                            // Target might not be found if deleted, but evidence_data has snapshot
                            const targetName = report.target?.full_name || report.evidence_data?.full_name || report.evidence_data?.username || 'Unknown User';

                            return (
                                <motion.div
                                    key={report.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">
                                                {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100">
                                                Reported: {targetName}
                                            </h3>
                                            <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-1">
                                                Reason: {report.reason}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
                                            statusConfig.bg,
                                            statusConfig.color,
                                            statusConfig.border
                                        )}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {statusConfig.label}
                                        </div>
                                    </div>

                                    {report.custom_note && (
                                        <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                                                "{report.custom_note}"
                                            </p>
                                        </div>
                                    )}

                                    {report.admin_conclusion && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl mt-1 shrink-0">
                                                    <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">
                                                        Admin Response
                                                    </p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                                        {report.admin_conclusion}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
