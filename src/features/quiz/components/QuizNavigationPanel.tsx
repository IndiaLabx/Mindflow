import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, CheckCircle, Flag, Star } from "lucide-react";
import { Question, QuizMode } from "../types";
import { cn } from "../../../utils/cn";

/**
 * A side drawer navigation panel for the active quiz session.
 *
 * Provides:
 * - A grid map of all questions.
 * - Visual status indicators (Answered, Correct/Wrong, Review, Bookmark).
 * - Progress statistics summary.
 * - Quick jump navigation.
 * - Submit/Finish action.
 *
 * Renders via React Portal to overlay the entire app.
 *
 * @param {object} props - The component props.
 * @returns {JSX.Element | null} The rendered panel.
 */
export function QuizNavigationPanel({
  isOpen,
  onClose,
  questions,
  userAnswers,
  currentQuestionIndex,
  onJumpToQuestion,
  markedForReview,
  bookmarks,
  onSubmitAndReview,
  mode,
  onReorderQuestions,
}: {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  userAnswers: { [key: string]: string };
  currentQuestionIndex: number;
  onJumpToQuestion: (index: number) => void;
  markedForReview: string[];
  bookmarks: string[];
  onSubmitAndReview: () => void;
  mode: QuizMode;
  onReorderQuestions?: (newQuestions: Question[]) => void;
}) {
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set([0]));
  const [groupByMode, setGroupByMode] = useState<"default" | "subject">(
    "default",
  );

  const subjects = useMemo(() => {
    const subs = new Set<string>();
    questions.forEach((q) => {
      const subject = q.subject || q.classification?.subject; if (subject) subs.add(subject);
    });
    return Array.from(subs);
  }, [questions]);

  const hasMultipleSubjects = subjects.length >= 2;
  const chunkSize = 25; // Group questions in chunks for easier navigation of large sets

  // Auto-expand the group containing the current question when opening
  useEffect(() => {
    if (isOpen) {
      const groupIdx = Math.floor(currentQuestionIndex / chunkSize);
      setOpenGroups(new Set([groupIdx]));
    }
  }, [isOpen, currentQuestionIndex]);

  // Create question chunks
  const handleGroupModeChange = (mode: "default" | "subject") => {
    setGroupByMode(mode);
    if (mode === "subject") {
      // Reorder global questions array by subject
      const newSortedQuestions = [...questions].sort((a, b) => {
        const subA = a.subject || a.classification?.subject || "Unknown";
        const subB = b.subject || b.classification?.subject || "Unknown";
        return subA.localeCompare(subB);
      });
      onReorderQuestions?.(newSortedQuestions);
      // Set open groups to all open by default when switching to subject mode for easier viewing
      const subjects = Array.from(
        new Set(
          newSortedQuestions.map((q) => q.subject || q.classification?.subject || "Unknown"),
        ),
      );
      setOpenGroups(new Set(subjects.map((_, i) => i)));
    } else {
      // In real implementation we don't necessarily have to "un-sort" it unless required.
      // Re-sorting back to original is hard without a stored original order, but the user is fine
      // keeping the subject sorted order and just paginating by 25.
      // Reset open groups
      const groupIdx = Math.floor(currentQuestionIndex / chunkSize);
      setOpenGroups(new Set([groupIdx]));
    }
  };

  const groups: { title: string; count: number; items: Question[] }[] = [];

  if (groupByMode === "default") {
    for (let i = 0; i < questions.length; i += chunkSize) {
      const groupItems = questions.slice(i, i + chunkSize);
      groups.push({
        title: `Questions ${i + 1}-${i + groupItems.length}`,
        count: groupItems.length,
        items: groupItems,
      });
    }
  } else {
    const subjectMap = new Map<string, Question[]>();
    questions.forEach((q) => {
      const sub = q.subject || q.classification?.subject || "Unknown Subject";
      if (!subjectMap.has(sub)) subjectMap.set(sub, []);
      subjectMap.get(sub)!.push(q);
    });

    Array.from(subjectMap.entries()).forEach(([sub, items]) => {
      groups.push({
        title: sub,
        count: items.length,
        items: items,
      });
    });
  }

  const toggleGroup = (idx: number) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Compute real-time stats for the summary header
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let answered = 0;

    questions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (ans) {
        answered++;
        if (ans === q.correct) correct++;
        else incorrect++;
      }
    });

    return {
      total: questions.length,
      answered,
      correct,
      incorrect,
      remaining: questions.length - answered,
    };
  }, [questions, userAnswers]);

  /**
   * Generates dynamic CSS classes for a question grid item based on its status.
   */
  const getStatusStyles = (q: Question, isCurrent: boolean) => {
    const ans = userAnswers[q.id];
    const isAnswered = !!ans;
    const isCorrect = isAnswered && ans === q.correct;

    const baseStyles =
      "h-10 w-full rounded-lg border text-sm font-bold flex items-center justify-center relative transition-all shadow-sm";

    // 1. Base Status Color
    let statusColor =
      "bg-slate-50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"; // Unanswered

    if (isAnswered) {
      if (mode === "mock") {
        // Mock Mode: Hides Correct/Incorrect status, just shows answered state
        statusColor =
          "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400";
      } else {
        // Learning Mode: Reveals Correct/Incorrect
        if (isCorrect) {
          statusColor =
            "bg-emerald-100 border-emerald-200 text-emerald-700 dark:text-emerald-400";
        } else {
          statusColor = "bg-rose-100 border-rose-200 text-rose-700";
        }
      }
    }

    // 2. Highlight Current Question
    const currentIndicator = isCurrent
      ? "ring-2 ring-indigo-600 ring-offset-1 z-10 scale-105"
      : "";

    return cn(baseStyles, statusColor, currentIndicator);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] transition-opacity duration-300 animate-in fade-in",
        )}
        onClick={onClose}
      />

      {/* Sliding Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-[80] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-gray-200 dark:border-gray-700 animate-in slide-in-from-right",
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Question Map
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Overview of your progress
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouping Controls */}
        {(hasMultipleSubjects || true) && (
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
            <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => handleGroupModeChange("default")}
                className={cn(
                  "flex-1 text-xs font-bold py-1.5 rounded-md transition-all",
                  groupByMode === "default"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
                )}
              >
                Group by 25
              </button>
              <button
                onClick={() => handleGroupModeChange("subject")}
                className={cn(
                  "flex-1 text-xs font-bold py-1.5 rounded-md transition-all",
                  groupByMode === "subject"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
                )}
              >
                By Subject
              </button>
            </div>
          </div>
        )}

        {/* Stats Summary Panel */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500 tracking-wider">
              Progress
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {stats.answered}/{stats.total} Attempted
            </span>
          </div>

          {mode === "mock" ? (
            // Mock Mode Stats (Masked)
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                  {stats.answered}
                </div>
                <div className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300/70 uppercase">
                  Done
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-gray-600 dark:text-gray-300 leading-none">
                  {stats.remaining}
                </div>
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Left
                </div>
              </div>
            </div>
          ) : (
            // Learning Mode Stats (Detailed)
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
                  {stats.correct}
                </div>
                <div className="text-[10px] font-bold text-emerald-800/70 uppercase">
                  Correct
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-rose-600 leading-none">
                  {stats.incorrect}
                </div>
                <div className="text-[10px] font-bold text-rose-800/70 uppercase">
                  Wrong
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-gray-600 dark:text-gray-300 leading-none">
                  {stats.remaining}
                </div>
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Left
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Question Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/30">
          {/* Visual Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm mb-2">
            {mode === "mock" ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-300 rounded-full"></div>{" "}
                  Attempted
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-slate-50 border border-gray-300 dark:border-gray-600 rounded-full"></div>{" "}
                  Unanswered
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-300 rounded-full"></div>{" "}
                  Correct
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-rose-100 border border-rose-300 rounded-full"></div>{" "}
                  Wrong
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-white dark:bg-gray-800 border-2 border-indigo-600 rounded-full"></div>{" "}
              Current
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-3 h-3 text-purple-500 fill-current" /> Review
            </div>
          </div>

          {/* Question Groups */}
          {groups.map((group, i) => {
            const isOpenGroup = openGroups.has(i);

            return (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleGroup(i)}
                  className="w-full flex justify-between items-center p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-slate-800 dark:bg-slate-800/50 transition-colors text-sm font-bold text-gray-700 dark:text-gray-200"
                >
                  <span>
                    {group.title}{" "}
                    <span className="text-gray-400 font-normal text-xs ml-1">
                      ({group.count}{" "}
                      {group.count === 1 ? "question" : "questions"})
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform",
                      isOpenGroup ? "rotate-180" : "",
                    )}
                  />
                </button>

                {isOpenGroup && (
                  <div className="p-3 pt-0 grid grid-cols-5 gap-2 bg-white dark:bg-gray-800">
                    {group.items.map((q) => {
                      const overallIdx = questions.findIndex(
                        (qu) => qu.id === q.id,
                      );
                      const isReview = markedForReview.includes(q.id);
                      const isBookmarked = bookmarks.includes(q.id);
                      const isCurrent = overallIdx === currentQuestionIndex;

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            onJumpToQuestion(overallIdx);
                          }}
                          className={getStatusStyles(q, isCurrent)}
                        >
                          {overallIdx + 1}

                          {/* Badges for Review/Bookmark */}
                          {isReview && (
                            <Flag className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-purple-600 fill-purple-100 bg-white dark:bg-gray-800 rounded-full shadow-sm ring-1 ring-white dark:ring-gray-800" />
                          )}
                          {isBookmarked && (
                            <Star className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 text-amber-400 fill-amber-400 bg-white dark:bg-gray-800 rounded-full shadow-sm ring-1 ring-white dark:ring-gray-800" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer: Submit Action / Close */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-95"
          >
            <CheckCircle className="w-5 h-5" /> Close Map
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
