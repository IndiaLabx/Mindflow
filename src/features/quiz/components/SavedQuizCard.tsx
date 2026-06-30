import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Play, Clock, BookOpen, Edit2, Check, X, Mic, CheckCircle, Loader2, Link, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNotification } from '@/stores/useNotificationStore';
import { SavedQuiz } from '../types';

interface SavedQuizCardProps {
    quiz: SavedQuiz;
    index: number;
    onResume: (quiz: SavedQuiz) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onEditName: (id: string, newName: string) => void;
}

export const SavedQuizCard: React.FC<SavedQuizCardProps> = ({ quiz, index, onResume, onDelete, onEditName }) => {
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

    useEffect(() => {
        setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    }, []);

    const isQuizFinished = quiz.state?.status === 'result';

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

    const isQuizStarted = (quiz.state?.currentQuestionIndex && quiz.state.currentQuestionIndex > 0) || (quiz.state?.answers && Object.keys(quiz.state.answers).length > 0);

    const progressPercent = quiz.questions?.length > 0 && quiz.state?.answers
        ? (Object.keys(quiz.state.answers).length / quiz.questions.length) * 100
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

    const handleActionClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.vibrate) navigator.vibrate(15);

        setIsActionLoading(true);
        try {
            // Await onResume in case it becomes async later
            await Promise.resolve(onResume(quiz));
        } catch (error) {
            console.error('Failed to resume quiz:', error);
            showToast({
                title: 'Network Error',
                message: 'Unable to load quiz. Please try again.',
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

    const progressColor = progressPercent === 0 ? '#9ca3af' // grey-400
        : progressPercent < 50 ? '#4f46e5' // indigo-600
        : progressPercent < 100 ? '#d97706' // amber-600
        : '#059669'; // emerald-600

    return (
        <motion.div layout transition={{ type: "spring", stiffness: 500, damping: 40 }} className="relative group p-[1px] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ml-3 mt-3 cursor-pointer">
            {/* Delete Pane Background (Glassmorphic) */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-800 rounded-3xl flex items-center justify-end px-8 z-0">
                <Trash2 className="text-white w-6 h-6" />
            </div>

            <motion.div
                drag={isTouchDevice ? "x" : false}
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={controls}
                layout transition={{ type: "spring", stiffness: 500, damping: 40 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full h-full bg-indigo-50/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl z-10 flex flex-col"
                onClick={handleCardClick}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0 pointer-events-none rounded-3xl" />
                <div className="absolute inset-0 rounded-3xl border-[2px] border-black dark:border-gray-400 z-10 transition-all duration-300 group-hover:border-indigo-500 dark:group-hover:border-indigo-400 pointer-events-none" />

                                    {/* Desktop Delete - Appears on Hover */}
                    {!isTouchDevice && (
                        <div className="absolute top-3 right-3 z-30 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {isDeleteConfirming ? (
                                    <motion.div
                                        key="confirm"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.15 }}
                                        className="flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 dark:border-slate-700 p-1"
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(quiz.id, e);
                                                setIsDeleteConfirming(false);
                                            }}
                                            className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 rounded-full transition-colors"
                                            title="Confirm Delete"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600" />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsDeleteConfirming(false);
                                            }}
                                            className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 rounded-full transition-colors"
                                            title="Cancel"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="trash"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 0, scale: 0.8, pointerEvents: 'none' }}
                                        whileHover={{ scale: 1.1 }}
                                        className="group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto p-2 text-slate-400 hover:text-rose-600 hover:drop-shadow-[0_0_8px_rgba(225,29,72,0.5)] transition-all duration-300"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDeleteConfirming(true);
                                        }}
                                        title="Delete Quiz"
                                    >
                                        <Trash2 className="w-5 h-5 stroke-[1.5]" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                {/* Micro-Typography Tag */}
                <div className="absolute top-0 left-0 bg-yellow-400 text-black font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-tl-3xl rounded-br-xl z-20 uppercase tracking-widest border-b-[2px] border-r-[2px] border-black pointer-events-none">
                    IDX: {String(index + 1).padStart(2, '0')}
                </div>

                {/* Main Content Area */}
                <div className="relative z-20 flex flex-col p-5 sm:p-6 pt-7 sm:pt-8 gap-4 flex-grow">

                    {/* Zone 2 & 3: Title and Editing State */}
                    <motion.div layout className="flex flex-col gap-2 w-full">
                        <div className="flex w-full justify-between items-center pr-8">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    className="flex-1 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-300 dark:border-indigo-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                    autoFocus
                                />
                            ) : (
                                <div className="flex items-center justify-between flex-1 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 group-hover:from-indigo-600 group-hover:to-indigo-800 dark:group-hover:from-indigo-300 dark:group-hover:to-indigo-100 transition-all duration-300 truncate">
                                            {quiz.name || 'Untitled Quiz'}
                                        </h3>
                                        <button
                                            onClick={startEditing}
                                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-60 hover:opacity-100 transition-all duration-300 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 shrink-0"
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
                        <div className="flex items-center justify-end gap-3 shrink-0 w-full mt-2">

                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="p-2.5 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-700/50 rounded-full transition-colors shadow-sm backdrop-blur-sm"
                                title="Share Quiz Link"
                            >
                                <motion.div whileHover={{ scale: 1.1, y: -2 }} transition={{ type: "spring", stiffness: 300 }}><Link className="w-4 h-4" /></motion.div>
                            </button>

                            {/* Talk Button (Visible by default) */}
                            {!isQuizFinished && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate('/quiz/live/' + quiz.id); }}
                                    className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 border border-amber-200/50 dark:border-amber-700/50 rounded-full transition-colors shadow-sm backdrop-blur-sm"
                                    title="Talk to Quiz Master"
                                >
                                    <motion.div whileHover={{ scale: 1.1, y: -2 }} transition={{ type: "spring", stiffness: 300 }}><Mic className="w-4 h-4" /></motion.div>
                                </button>
                            )}

                            {/* Rectangular Action Button with Progress Fill */}
                            <button
                                onClick={handleActionClick}
                                disabled={isActionLoading}
                                className="relative flex items-center justify-center h-10 min-w-[3rem] px-3 md:px-4 rounded-xl bg-white dark:bg-slate-800 shadow-md hover:shadow-lg disabled:opacity-80 disabled:cursor-not-allowed transition-all overflow-hidden shrink-0"
                                title={isQuizFinished ? "Results" : isQuizStarted ? "Resume" : "Start"}
                            >
                                {/* Apple App Store style progress background fill */}
                                <div
                                    className="absolute inset-y-0 left-0 transition-all duration-500 ease-out pointer-events-none opacity-20 dark:opacity-30"
                                    style={{
                                        width: `${progressPercent}%`,
                                        backgroundColor: progressColor,
                                    }}
                                />

                                {/* Button Content */}
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    {isActionLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                Loading...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {isQuizFinished ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            ) : (
                                                <Play className="w-5 h-5 text-indigo-600 dark:text-indigo-400 ml-0.5" />
                                            )}

                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {isQuizFinished ? "Results" : isQuizStarted ? "Resume" : "Start"}
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
                                        <span className="truncate">{quiz?.filters?.subject ? (Array.isArray(quiz.filters.subject) ? quiz.filters.subject.join(', ') : quiz.filters.subject) : 'All Subjects'}</span>
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

                                    {/* Bottom Right: Progress Math */}
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/50 text-slate-700 dark:text-slate-200 backdrop-blur-sm truncate justify-between">
                                        <span className="opacity-70 shrink-0">📊 Progress</span>
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                            {Object.keys(quiz.state?.answers || {}).length} / {quiz.questions?.length || 0}
                                        </span>
                                    </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </motion.div>
        </motion.div>
    );
};
