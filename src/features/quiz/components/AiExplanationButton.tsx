import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Loader2, Sparkles, AlertCircle, Copy, Download, ThumbsUp, ThumbsDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { useNotification } from '../../../stores/useNotificationStore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Question } from '../types';
import { supabase } from '../../../lib/supabase';
import DOMPurify from 'dompurify';

// Configure DOMPurify to allow KaTeX math classes and markdown elements
const purifyConfig = {
    ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'span',
        'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'blockquote',
        'math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'msqrt', 'mroot' // Basic MathML tags
    ],
    ALLOWED_ATTR: ['href', 'class', 'target', 'rel', 'style'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['on*']
};


interface AiExplanationButtonProps {
    question: Question;
    selectedAnswer?: string;
}

interface AiResponse {
    correct_answer: string;
    reasoning: string;
    exam_facts: string[];
    recent_news: string;
    interesting_facts: string[];
    fun_fact: string;
}

const ExplanationSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {/* Correct Answer Skeleton */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
            <div className="h-4 w-32 bg-emerald-200 dark:bg-emerald-800/50 rounded mb-3"></div>
            <div className="h-6 w-3/4 bg-emerald-200 dark:bg-emerald-800/50 rounded"></div>
        </div>

        {/* Reasoning Skeleton */}
        <div>
            <div className="h-4 w-40 bg-indigo-100 dark:bg-indigo-900/30 rounded mb-3"></div>
            <div className="space-y-2">
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-700/50 rounded"></div>
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-700/50 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
                <div className="h-4 w-4/6 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
            </div>
        </div>

        {/* Exam Facts Skeleton */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
            <div className="h-4 w-36 bg-blue-200 dark:bg-blue-800/50 rounded mb-3"></div>
            <div className="space-y-2">
                <div className="flex gap-2"><div className="h-4 w-4 bg-blue-200 dark:bg-blue-800/50 rounded-full shrink-0"></div><div className="h-4 w-full bg-blue-100 dark:bg-blue-900/40 rounded"></div></div>
                <div className="flex gap-2"><div className="h-4 w-4 bg-blue-200 dark:bg-blue-800/50 rounded-full shrink-0"></div><div className="h-4 w-5/6 bg-blue-100 dark:bg-blue-900/40 rounded"></div></div>
                <div className="flex gap-2"><div className="h-4 w-4 bg-blue-200 dark:bg-blue-800/50 rounded-full shrink-0"></div><div className="h-4 w-4/6 bg-blue-100 dark:bg-blue-900/40 rounded"></div></div>
            </div>
        </div>
    </div>
);


/**
 * A button component that triggers an AI-powered explanation for the current question.
 */
export const AiExplanationButton: React.FC<AiExplanationButtonProps> = ({ question, selectedAnswer }) => {
    const [isOpen, setIsOpen] = useState(false);


    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Consulting the AI Tutor...");
    const [data, setData] = useState<AiResponse | null>(null);
    const [explanationId, setExplanationId] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { showToast } = useNotification();

    const handleCopy = () => {
        if (!data) return;
        const textToCopy = `
Correct Answer: ${data.correct_answer}

Reasoning: ${data.reasoning}

Exam Facts:
${data.exam_facts?.map(f => '- ' + f).join('\n')}

Recent News: ${data.recent_news}

Did You Know:
${data.interesting_facts?.map(f => '- ' + f).join('\n')}

Fun Fact: ${data.fun_fact}
`.trim();
        navigator.clipboard.writeText(textToCopy);
        showToast({ title: 'Copied!', message: 'Explanation copied to clipboard.', variant: 'success', duration: 2000 });
    };

    const handleDownload = async () => {
        if (!contentRef.current) return;
        showToast({ title: 'Downloading...', message: 'Preparing image, please wait.', variant: 'info', duration: 2000 });
        try {
            const element = contentRef.current;
            const originalScrollTop = element.scrollTop;
            // A common workaround for html2canvas to capture full scrolling content:
            // Temporarily set height to max-content and overflow to visible.
            const originalHeight = element.style.height;
            const originalOverflow = element.style.overflow;
            element.style.height = 'max-content';
            element.style.overflow = 'visible';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                windowHeight: element.scrollHeight,
                height: element.scrollHeight,
                scrollY: -window.scrollY
            });

            // Restore original styles
            element.style.height = originalHeight;
            element.style.overflow = originalOverflow;
            element.scrollTop = originalScrollTop;

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'ai-explanation.png';
            link.href = dataUrl;
            link.click();
            showToast({ title: 'Success!', message: 'Image downloaded successfully.', variant: 'success', duration: 2000 });
        } catch (error) {
            console.error('Download failed:', error);
            showToast({ title: 'Error', message: 'Failed to download image.', variant: 'error', duration: 2000 });
        }
    };

    const handleVote = async (isHelpful: boolean) => {
        if (!explanationId || hasVoted) return;
        setHasVoted(true);
        showToast({ title: 'Thank You!', message: 'Your feedback helps improve the AI Tutor.', variant: 'success', duration: 2000 });

        try {
            await supabase.rpc('vote_explanation', {
                p_explanation_id: explanationId,
                p_is_helpful: isHelpful
            });
        } catch (err) {
            console.error("Failed to submit vote:", err);
            setHasVoted(false);
        }
    };

    const handleCloseModal = () => {
        setIsOpen(false);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    const handleExplain = async (e?: React.MouseEvent) => {
        e?.stopPropagation(); // Prevent bubbling that might immediately trigger outside click listeners
        setIsOpen(true);
        if (data || isLoading) return; // Concurrency protection

        // Check if the explanation is already cached directly on the question object
        if ((question as any).ask_ai_explanation) {
            setIsLoading(true);
            const cachedData = (question as any).ask_ai_explanation;

            // Add a cinematic delay to simulate AI processing even for cached responses
            const fakeDelay = 1400 + Math.random() * 900;

            // We still want to allow early cancellation if the user closes the modal
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            // Capture the current question ID for strict identity validation
            const requestQuestionId = question.id;

            try {
                await new Promise<void>((resolve, reject) => {
                    const timer = setTimeout(resolve, fakeDelay);
                    signal.addEventListener('abort', () => {
                        clearTimeout(timer);
                        reject(new DOMException('abort', 'AbortError'));
                    });
                });

                // Ensure component is still mounted and question identity hasn't changed
                if (!signal.aborted && requestQuestionId === question.id) {
                    setData(cachedData);
                    setExplanationId(question.id);
                    setHasVoted(false);
                }
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log('AI Explanation cached delay aborted');
                }
            } finally {
                if (!signal.aborted) {
                    setIsLoading(false);
                }
            }
            return;
        }

        setIsLoading(true);
        setError(null);

        // Setup AbortController and Timeout
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const timeoutId = setTimeout(() => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort('timeout');
            }
        }, 45000); // 45-second strict timeout for grounding models

        try {
            // Using standard fetch structure wrapper if supabase invoke doesn't support signal cleanly,
            // but we can just use a Promise wrapper to enforce the abort locally.
            const payload = {
                questionId: question.id,
                locale: 'en'
            };
            console.log("ASK_AI_PAYLOAD", payload);

            const invokePromise = supabase.functions.invoke('ask-ai-tutor', {
                body: payload
            });

            const abortPromise = new Promise((_, reject) => {
                signal.addEventListener('abort', () => {
                    reject(new DOMException(signal.reason === 'timeout' ? 'timeout' : 'abort', 'AbortError'));
                });
            });

            const { data: resultData, error: invokeError } = await Promise.race([invokePromise, abortPromise]) as any;

            console.log("RAW invoke result:", resultData);
            console.log("RAW invoke error:", invokeError);

            if (invokeError) {
                console.error("Function invocation error:", invokeError);
                throw new Error("network_error");
            }

            if (resultData?.error) {
                console.error("Backend returned error:", resultData.error);
                if (resultData.error === 'quota_exceeded') throw new Error('quota_exceeded');
                if (resultData.error === 'kill_switch_active') throw new Error('kill_switch_active');
                throw new Error("provider_error");
            }

            if (resultData?.data) {
                // Prevent state updates if aborted or closed
                if (!signal.aborted) {
                    setData(resultData.data);
                }
            } else {
                throw new Error("empty_response");
            }

        } catch (err: any) {
            if (err.name === 'AbortError') {
                if (err.message === 'timeout') {
                    if (!signal.aborted || signal.reason === 'timeout') setError("The request took too long. Please try again.");
                } else {
                    // Modal was closed, silent abort
                    console.log("AI Explanation request cancelled by user.");
                }
            } else {
                console.error("AI Explanation Error:", err);

                // Only update state if modal is still active
                if (!signal.aborted) {
                    // User-Friendly Error Translation Layer
                    switch (err.message) {
                        case 'network_error':
                            setError("Network issue. Please check your connection.");
                            break;
                        case 'quota_exceeded':
                            setError("Daily AI Tutor limit reached. Please try again tomorrow.");
                            break;
                        case 'kill_switch_active':
                            setError("The AI Tutor is currently down for maintenance. Please check back later.");
                            break;
                        case 'provider_error':
                        case 'empty_response':
                            setError("AI Tutor is currently busy or overloaded. Please try again shortly.");
                            break;
                        default:
                            setError("Something went wrong loading the explanation.");
                    }
                }
            }
        } finally {
            console.log("Entering finally block");
            clearTimeout(timeoutId);
            console.log("AI request finally block executed. Setting isLoading false.");
            // Always ensure loading is false when the attempt finishes so it never gets stuck
            setIsLoading(false);

            if (abortControllerRef.current?.signal === signal) {
                 abortControllerRef.current = null;
            }
        }
    };

    // Cycle loading messages for better perceived UX
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            const messages = [
                "🧠 Analyzing concepts...",
                "📚 Reviewing exam patterns...",
                "🔎 Connecting related facts...",
                "✨ Preparing explanation..."
            ];
            let index = 0;
            setLoadingMessage(messages[0]);
            interval = setInterval(() => {
                index = (index + 1) % messages.length;
                setLoadingMessage(messages[index]);
            }, 400);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    // Close modal on click outside and handle escape key (for hardware back)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
                handleCloseModal();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCloseModal();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    // Question ID change reset & Strict Unmount Cleanup
    useEffect(() => {
        // Reset state if question identity changes
        setIsOpen(false);
        setIsLoading(false);
        setData(null);
        setExplanationId(null);
        setHasVoted(false);
        setError(null);

        // Abort any ongoing request for the old question
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [question.id]);

    return (
        <>
            <button
                onClick={handleExplain}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all hover:scale-105"
                title="Get AI Explanation"
            >
                <Bot className="w-4 h-4" />
                Ask AI Tutor
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        ref={overlayRef}
                        role="dialog"
                        aria-modal="true"
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 zoom-in-95 duration-300"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40">
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                <Sparkles className="w-5 h-5" />
                                <h3 className="font-bold text-lg">AI Explanation</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {data && !isLoading && !error && (
                                    <>
                                        <button
                                            onClick={handleCopy}
                                            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow shadow-sm transition-all border border-gray-200 dark:border-gray-700"
                                            title="Copy Text"
                                         aria-label="Copy text">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleDownload}
                                            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow shadow-sm transition-all border border-gray-200 dark:border-gray-700 mr-2"
                                            title="Download as Image"
                                         aria-label="Download file">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={handleCloseModal}
                                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div ref={contentRef} className="p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800">
                            {isLoading ? (
                                <div>
                                    {/* Premium Loading Header */}
                                    <div className="flex flex-col items-center justify-center py-6 mb-4 text-center border-b border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-center gap-1.5 mb-3 h-8">
                                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 font-medium text-sm transition-opacity duration-300 ease-in-out">{loadingMessage}</p>
                                    </div>

                                    {/* Shimmer Skeleton Body */}
                                    <ExplanationSkeleton />
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-red-500">
                                    <AlertCircle className="w-10 h-10 mb-2" />
                                    <p className="font-medium">Oops! Failed to load explanation.</p>
                                    <p className="text-sm opacity-80 mt-1">{error}</p>
                                    <button
                                        onClick={() => { setData(null); handleExplain(); }}
                                        className="mt-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : data ? (
                                <div className="space-y-6">
                                    {/* 1. Correct Answer */}
                                    {data.correct_answer && (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '100ms' }}>
                                            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                                <span>✅</span> Correct Answer
                                            </h4>
                                            <div className="text-emerald-900 dark:text-emerald-100 text-lg font-bold leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{DOMPurify.sanitize(data.correct_answer || "", purifyConfig)}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Reasoning */}
                                    {data.reasoning && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '300ms' }}>
                                            <h4 className="text-sm uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-bold mb-2 flex items-center gap-2">
                                                <span>🧠</span> Analysis & Reasoning
                                            </h4>
                                            <div className="text-gray-800 dark:text-gray-100 leading-relaxed text-[0.95rem] prose dark:prose-invert max-w-none prose-sm sm:prose-base prose-p:my-1 prose-li:my-0">
                                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{DOMPurify.sanitize(data.reasoning || "", purifyConfig)}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Exam Facts */}
                                    {data.exam_facts && data.exam_facts.length > 0 && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '500ms' }}>
                                            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                <span className="text-lg">📚</span> Exam Special Facts (PYQs)
                                            </h4>
                                            <ul className="space-y-2 list-none pl-1">
                                                {data.exam_facts.map((fact, i) => (
                                                    <li key={i} className="text-blue-900 dark:text-blue-100 text-sm flex gap-2 items-start">
                                                        <span className="text-blue-500 mt-0.5 font-bold">✓</span>
                                                        <span className="flex-1">
                                                             <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{DOMPurify.sanitize(fact || "", purifyConfig)}</ReactMarkdown>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* 4. Recent News */}
                                    {data.recent_news && (
                                         <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-100 dark:border-rose-800/30 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '700ms' }}>
                                            <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400 mb-2 flex items-center gap-2">
                                                <span className="text-lg">📰</span> Recent News & Updates
                                            </h4>
                                            <div className="text-rose-900 dark:text-rose-100 text-sm prose dark:prose-invert max-w-none prose-sm">
                                                 <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{DOMPurify.sanitize(data.recent_news || "", purifyConfig)}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. Interesting Facts */}
                                    {data.interesting_facts && data.interesting_facts.length > 0 && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '900ms' }}>
                                            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                                                <span className="text-lg">💡</span> Did You Know?
                                            </h4>
                                            <ul className="space-y-2 list-none pl-1">
                                                {data.interesting_facts.map((fact, i) => (
                                                    <li key={i} className="text-amber-900 dark:text-amber-100 text-sm flex gap-2 items-start">
                                                        <span className="text-amber-400 mt-0.5 font-bold">•</span>
                                                        <span className="flex-1">
                                                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{DOMPurify.sanitize(fact || "", purifyConfig)}</ReactMarkdown>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                     {/* 6. Fun Fact */}
                                     {data.fun_fact && (
                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '1100ms' }}>
                                            <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-2">
                                                <span>🎉</span> Fun Fact
                                            </h4>
                                            <div className="text-purple-900 dark:text-purple-200 text-sm italic prose dark:prose-invert max-w-none prose-sm">
                                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{DOMPurify.sanitize(data.fun_fact || "", purifyConfig)}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* 7. Feedback Voting */}
                                    {explanationId && (
                                        <div className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: '1300ms' }}>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Was this explanation helpful?</p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleVote(true)}
                                                    disabled={hasVoted}
                                                    className={`p-2 rounded-full transition-colors ${hasVoted ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-500'}`}
                                                    aria-label="Thumbs up"
                                                >
                                                    <ThumbsUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleVote(false)}
                                                    disabled={hasVoted}
                                                    className={`p-2 rounded-full transition-colors ${hasVoted ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                                                    aria-label="Thumbs down"
                                                >
                                                    <ThumbsDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
