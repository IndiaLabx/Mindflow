import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, UserMinus } from 'lucide-react';

interface BlockUserPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBlock: () => void;
    targetName: string;
}

export const BlockUserPromptModal: React.FC<BlockUserPromptModalProps> = ({ isOpen, onClose, onBlock, targetName }) => {
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
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-center p-6"
                    >
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <UserMinus className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                            Would you also like to block this user?
                        </h3>

                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Blocking {targetName} will hide their posts from you and prevent them from messaging you.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    onBlock();
                                    onClose();
                                }}
                                className="w-full py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-600/20"
                            >
                                Yes, Block {targetName}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                No, Just Report
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
