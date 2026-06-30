import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, customNote: string) => void;
    targetName: string;
}

const USER_REASONS = [
    'Spam',
    'Harassment/Bullying',
    'Hate Speech',
    'Inappropriate Content',
    'Impersonation'
];
const CONTENT_REASONS = [
    'Misinformation',
    'Copyright/Plagiarism',
    'Violence',
    'Spam/Scam',
    'Promoting Self-Harm'
];

export const ReportModal: React.FC<ReportModalProps & { targetType?: 'user' | 'post' | 'reel' }> = ({ isOpen, onClose, onSubmit, targetName, targetType = 'user' }) => {
    const [step, setStep] = useState(1);
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [customNote, setCustomNote] = useState('');

    const handleNext = () => {
        if (selectedReason) {
            setStep(2);
        }
    };

    const handleSubmit = () => {
        onSubmit(selectedReason, customNote);
        onClose(); // Close instantly for eye-blink fast experience
    };

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            // Slight delay to wait for exit animation to finish
            const timer = setTimeout(() => {
                setStep(1);
                setSelectedReason('');
                setCustomNote('');
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

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
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-xl">
                                    <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{targetType === 'user' ? 'Report User' : 'Report Content'}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Reporting {targetType === 'user' ? targetName : (targetType === 'post' ? 'Post' : 'Reel')}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content area with slider */}
                        <div className="relative overflow-hidden min-h-[300px]">
                            <AnimatePresence mode="wait" initial={false}>
                                {step === 1 ? (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-6 absolute inset-0"
                                    >
                                        <h4 className="text-base font-medium text-slate-800 dark:text-slate-200 mb-4">Why are you reporting this {targetType}?</h4>
                                        <div className="space-y-2">
                                            {(targetType === 'user' ? USER_REASONS : CONTENT_REASONS).map((reason) => (
                                                <label
                                                    key={reason}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                        selectedReason === reason
                                                            ? 'border-red-500 bg-red-50 dark:bg-red-500/10 dark:border-red-500'
                                                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="reportReason"
                                                        value={reason}
                                                        checked={selectedReason === reason}
                                                        onChange={() => setSelectedReason(reason)}
                                                        className="w-4 h-4 text-red-500 focus:ring-red-500 border-gray-300"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{reason}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-6 absolute inset-0 flex flex-col"
                                    >
                                        <h4 className="text-base font-medium text-slate-800 dark:text-slate-200 mb-4">Additional Details</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            Provide any extra information that might help us understand the situation better.
                                        </p>
                                        <textarea
                                            value={customNote}
                                            onChange={(e) => setCustomNote(e.target.value)}
                                            placeholder="Provide additional details (optional, max 500 characters)..."
                                            maxLength={500}
                                            className="w-full flex-1 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm"
                                        />
                                        <div className="text-right text-xs text-slate-500 mt-2">
                                            {customNote.length}/500
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button
                                onClick={step === 2 ? () => setStep(1) : onClose}
                                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                {step === 2 ? 'Back' : 'Cancel'}
                            </button>

                            {step === 1 ? (
                                <button
                                    onClick={handleNext}
                                    disabled={!selectedReason}
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-slate-900 dark:hover:bg-white transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
                                >
                                    Continue <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-600/20"
                                >
                                    Submit Report
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
