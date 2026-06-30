import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Clock, BookOpen, Edit2, Check, X, CheckCircle, Loader2, Award, Link, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useNotification } from '@/stores/useNotificationStore';
import { SavedQuiz } from '../types';

interface AttemptedQuizCardProps {
    quiz: SavedQuiz;
    index: number;
    onViewResults: (quiz: SavedQuiz) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onEditName: (id: string, newName: string) => void;
}

export const AttemptedQuizCard: React.FC<AttemptedQuizCardProps> = ({ quiz, index, onViewResults, onDelete, onEditName }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const { showToast } = useNotification();
    const [editName, setEditName] = useState(quiz.name);
    const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

    // Swipe gestures
    const controls = useAnimation();
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const x = useMotionValue(0);
    const deleteOpacity = useTransform(x, [0, -20, -50], [0, 0, 1]);

    useEffect(() => {
        setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    }, []);

    const scorePercent = quiz.questions.length > 0
        ? (quiz.state.score / quiz.questions.length) * 100
        : 0;

    const startEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditName(quiz.name);
    };

    const saveEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editName.trim()) {
            onEditName(quiz.id, editName.trim());
            setIsEditing(false);
        }
    };

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditName(quiz.name);
    };

    const handleCardClick = () => {
        if (!isEditing) {
            setIsExpanded(!isExpanded);
        }
    };


    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const shareUrl = `${window.location.origin}${window.location.pathname}#/share/${quiz.id}`;
            await navigator.clipboard.writeText(shareUrl);
            showToast({
                variant: 'success',
                message: 'Link copied! Share with your friends.',
            });
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast({ variant: 'error', message: 'Failed to copy link.' });
        }
    };

    const handleActionClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.vibrate) navigator.vibrate(15);

        setIsActionLoading(true);
        try {
            await Promise.resolve(onViewResults(quiz));
        } catch (error) {
            console.error('Failed to open results:', error);
            showToast({
                title: 'Error',
                message: 'Unable to open results. Please try again.',
                variant: 'error'
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.x < -80) {
            if (navigator.vibrate) navigator.vibrate(50);
            onDelete(quiz.id, event as unknown as React.MouseEvent);
            controls.start({ x: 0 }); // reset position if not deleted
        } else {
            controls.start({ x: 0 });
        }
    };

    const scoreColor = scorePercent < 40 ? '#ef4444' // red-500
        : scorePercent < 70 ? '#f59e0b' // amber-500
        : '#10b981'; // emerald-500

    return (
        <div className="relative group/card perspective-1000">
            {/* Delete Confirmation Overlay / Underlay for Touch Devices */}
            <motion.div style={{ opacity: deleteOpacity }} className="absolute inset-y-0 right-0 w-24 bg-rose-500 rounded-3xl flex items-center justify-end pr-6 shadow-inner z-0 pointer-events-none">
                <Trash2 className="w-6 h-6 text-white/80" />
            </motion.div>

            <motion.div
                drag={isTouchDevice ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}

                style={{ x }}
                whileHover={!isTouchDevice ? { scale: 1.01 } : {}}
                whileTap={{ scale: 0.98 }}
                className="relative z-10 w-full h-full cursor-pointer touch-pan-y"
                onClick={handleCardClick}
                layout
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{
                    opacity: { duration: 0.2, delay: index * 0.05 },
                    y: { type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 },
                    layout: { type: "spring", stiffness: 500, damping: 40 }
                }}
            >
                {/* Main Card Container */}
                <div className="relative w-full overflow-hidden rounded-3xl p-4 sm:p-5 flex flex-col justify-between h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 group-hover/card:border-indigo-300 dark:group-hover/card:border-indigo-500/50">

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Zone 1 & 2 Container (Top section with Name and Actions) */}
                    <motion.div layout transition={{ type: "spring", stiffness: 500, damping: 40 }} className="flex flex-col gap-3 relative z-10">
                        <div className="flex justify-between items-start gap-4">
                            {/* Desktop Delete Button (Absolute Right) */}
                            {!isTouchDevice && (
                                <button
                                    onClick={(e) => onDelete(quiz.id, e)}
                                    className="absolute -top-1 -right-1 p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-600 rounded-full opacity-0 group-hover/card:opacity-100 transition-all duration-300 shrink-0 scale-90 group-hover/card:scale-100 shadow-sm"
                                    title="Delete Quiz"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}

                            {/* Zone 1: Icon & Name */}
                            {isEditing ? (
                                <div className="flex items-center gap-2 flex-1 w-full" onClick={e => e.stopPropagation()}>
                                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 shrink-0">
                                        <Award className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 font-semibold shadow-sm transition-all"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between flex-1 group min-w-0 pr-8">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800/50 shadow-inner shrink-0 group-hover/card:scale-110 transition-transform duration-300">
                                            <Award className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                        </div>
                                        <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 group-hover:from-indigo-600 group-hover:to-indigo-800 dark:group-hover:from-indigo-300 dark:group-hover:to-indigo-100 transition-all duration-300 truncate">
                                            {quiz.name || 'Untitled Quiz'}
                                        </h3>
                                        <button
                                            onClick={startEditing}
                                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 shrink-0"
                                            title="Edit Name"
                                         aria-label="Edit item">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                        className="ml-2 text-slate-400 dark:text-slate-500 shrink-0"
                                    >
                                        <ChevronDown className="w-5 h-5" />
                                    </motion.div>
                                </div>
                            )}
                        </div>

                        {/* Zone 3: Save / Cancel row (graceful push) */}
                        <AnimatePresence>
                            {isEditing && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="flex gap-2 overflow-hidden"
                                >
                                    <button onClick={saveEdit} className="flex-1 py-1.5 flex justify-center items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 rounded-lg transition-colors shadow-sm">
                                        <Check className="w-4 h-4" /> Save
                                    </button>
                                    <button onClick={cancelEdit} className="flex-1 py-1.5 flex justify-center items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-800/50 rounded-lg transition-colors shadow-sm">
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                        {/* Actions Container */}
                        <div className="flex items-center gap-3 shrink-0 mt-4">

                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="p-2.5 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-700/50 rounded-full transition-colors shadow-sm backdrop-blur-sm shrink-0"
                                title="Share Quiz Link"
                            >
                                <motion.div whileHover={{ scale: 1.1, y: -2 }} transition={{ type: "spring", stiffness: 300 }}><Link className="w-4 h-4" /></motion.div>
                            </button>

                            {/* Rectangular Action Button with Progress Fill */}
                            <button
                                onClick={handleActionClick}
                                disabled={isActionLoading}
                                className="relative flex items-center justify-center h-10 w-full px-3 md:px-4 rounded-xl bg-white dark:bg-slate-800 shadow-md hover:shadow-lg disabled:opacity-80 disabled:cursor-not-allowed transition-all overflow-hidden shrink-0"
                                title="View Results"
                            >
                                {/* Apple App Store style progress background fill based on score */}
                                <div
                                    className="absolute inset-y-0 left-0 transition-all duration-500 ease-out pointer-events-none opacity-20 dark:opacity-30"
                                    style={{
                                        width: `${scorePercent}%`,
                                        backgroundColor: scoreColor,
                                    }}
                                />

                                {/* Button Content */}
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    {isActionLoading ? (
                                        <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                View Results
                                            </span>
                                        </>
                                    )}
                                </div>
                            </button>
                        </div>

                    {/* Zone 5: Expandable Details Drawer */}
                    <AnimatePresence initial={false}>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ opacity: { duration: 0.2 }, height: { type: "spring", stiffness: 500, damping: 40 } }}
                                className="w-full overflow-hidden"
                            >
                                <div className="pt-4 mt-4 border-t border-indigo-100/50 dark:border-slate-700/50 text-xs font-semibold">
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                    {/* Top Left: Subject */}
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/50 text-slate-600 dark:text-slate-300 backdrop-blur-sm truncate">
                                        <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                                        <span className="truncate">{quiz.filters.subject}</span>
                                    </div>

                                    {/* Top Right: Date */}
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/50 text-slate-600 dark:text-slate-300 backdrop-blur-sm truncate">
                                        <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="truncate">{new Date(quiz.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                    </div>

                                    {/* Bottom Left: Mode */}
                                    <div className={"flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm border truncate " + (
                                        quiz.mode === 'mock'
                                        ? 'bg-purple-50/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300'
                                        : 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300'
                                    )}>
                                        <span className="truncate">{quiz.mode === 'mock' ? '⚙️ Mock Test' : '⚙️ Learning Mode'}</span>
                                    </div>

                                    {/* Bottom Right: Score Math */}
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/50 text-slate-700 dark:text-slate-200 backdrop-blur-sm truncate justify-between">
                                        <span className="opacity-70 shrink-0">📊 Score</span>
                                        <span className="font-bold shrink-0" style={{ color: scoreColor }}>
                                            {quiz.state.score} / {quiz.questions.length}
                                        </span>
                                    </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
