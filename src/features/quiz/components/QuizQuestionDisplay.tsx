import React, { useMemo, useEffect } from 'react';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';
import { Question } from '../types';
import { QuizOption } from './QuizOption';
import { AiExplanationButton } from './AiExplanationButton';
import { Clock, Hash, Calendar, FileText, Volume2, Square, Loader2, Copy, Check, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { AdminEditQuestionModal } from '../../../features/admin/components/AdminEditQuestionModal';
import { Edit } from 'lucide-react';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';

// --- Client-Side Sanitizer ---
/**
 * Strips dangerous tags and attributes from HTML strings to prevent XSS.
 * Keeps basic formatting (b, i, p, etc.) but removes scripts, iframes, and event handlers.
 *
 * @param {string} html - The potentially unsafe HTML string.
 * @returns {string} Sanitized HTML string.
 */
const sanitizeHTML = (html: string) => {
    if (!html) return "";
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 1. Remove dangerous tags completely
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'link', 'style', 'meta'];
    dangerousTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach(el => el.remove());
    });

    // 2. Remove dangerous attributes (on* events, javascript: links)
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
        const attributes = Array.from(el.attributes);
        attributes.forEach(attr => {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name); // Remove onclick, onerror, etc.
            }
            if (attr.name === 'href' && attr.value.toLowerCase().includes('javascript:')) {
                el.removeAttribute('href'); // Remove javascript: links
            }
        });
    });

    return doc.body.innerHTML;
};

/**
 * The core component for displaying a single quiz question.
 *
 * Includes:
 * - Question metadata (ID, Exam Source, Year).
 * - Question text (with HTML support).
 * - Hindi translation (if available) with TTS support.
 * - Answer options grid.
 * - Zoom level scaling.
 *
 * @param {object} props - The component props.
 * @returns {JSX.Element} The rendered question display.
 */
export function QuizQuestionDisplay({
    question,
    selectedAnswer,
    hiddenOptions = [],
    onAnswerSelect,
    zoomLevel,
    isMockMode = false,
    userTime
}: {
    question: Question;
    selectedAnswer?: string;
    hiddenOptions?: string[];
    onAnswerSelect: (answer: string) => void;
    zoomLevel: number;
    isMockMode?: boolean;
    userTime?: number;
}) {

    const isAnswered = !!selectedAnswer;
    const { speak, stop, isPlaying, isLoading, error } = useTextToSpeech();
    const { showToast } = useNotification();
    const [isCopied, setIsCopied] = React.useState(false);
    const { user } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const isAdmin = user?.email === 'admin@mindflow.com';

    const stripHtmlRegex = React.useCallback((html?: string) => {
        if (!html) return "";
        return html.replace(/<[^>]*>?/gm, '');
    }, []);

    const formatCopyText = React.useCallback((questionToCopy: Question) => {
        let text = `${stripHtmlRegex(questionToCopy.question)}\n`;
        if (questionToCopy.question_hi) {
            text += `${stripHtmlRegex(questionToCopy.question_hi)}\n`;
        }

        text += "\n";

        questionToCopy.options.forEach((opt, idx) => {
            text += `${idx + 1}. ${stripHtmlRegex(opt)}\n`;
            if (questionToCopy.options_hi && questionToCopy.options_hi[idx]) {
                text += `   ${stripHtmlRegex(questionToCopy.options_hi[idx])}\n`;
            }
        });

        return text.trim();
    }, [stripHtmlRegex]);


    const handleDownload = React.useCallback(async () => {
        try {
            const container = document.getElementById('quiz-card-container');
            if (!container) {
                console.error('Quiz container not found');
                showToast({ variant: 'error', message: 'Could not find element to capture', duration: 2000 });
                return;
            }

            // Save original styles
            const originalMaxHeight = container.style.maxHeight;
            const originalOverflow = container.style.overflow;

            // Modify styles to capture full content
            container.style.maxHeight = 'none';
            container.style.overflow = 'visible';

            // Slight delay to ensure DOM updates
            await new Promise(resolve => setTimeout(resolve, 50));

            const canvas = await html2canvas(container, {
                useCORS: true,
                scale: 2,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                windowWidth: container.scrollWidth,
                windowHeight: container.scrollHeight,
            });

            // Restore original styles
            container.style.maxHeight = originalMaxHeight;
            container.style.overflow = originalOverflow;

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `MindFlow-Question-${question.id || 'export'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast({ variant: 'success', message: 'Downloaded successfully', duration: 2000 });
        } catch (err) {
            console.error("Failed to download image: ", err);
            showToast({ variant: 'error', message: 'Failed to download image', duration: 2000 });
        }
    }, [question.id, showToast]);

    const handleCopy = React.useCallback(async () => {
        try {
            const textToCopy = formatCopyText(question);
            await navigator.clipboard.writeText(textToCopy);
            setIsCopied(true);
            showToast({
                variant: 'success',
                message: 'Copied successfully',
                duration: 1000
            });
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
            showToast({
                variant: 'error',
                message: 'Failed to copy',
                duration: 2000
            });
        }
    }, [question, formatCopyText, showToast]);



// Stop any playing audio when the question changes to prevent bleed-over
    useEffect(() => {
        stop();
    }, [question.id, stop]);

    // Show toast on TTS error
    useEffect(() => {
        if (error) {
            showToast({ variant: 'error', message: error, duration: 3000 });
        }
    }, [error, showToast]);
    
    // Helper to safely render HTML content after sanitization
    const createSafeMarkup = (html: string) => {
        return { __html: sanitizeHTML(html) };
    };

    return (
        <div 
            className="space-y-6 transition-all duration-200 ease-out"
            style={{ fontSize: `${zoomLevel}rem` }} // Applies zoom to everything inside via CSS inheritance
        >
            {/* Metadata Header - Visible in all modes for context */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800 text-[0.75rem] text-gray-400 dark:text-slate-500 font-medium select-none">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                         <Hash className="w-3 h-3" /> {question.v1_id || question.id}
                    </span>
                    {(question.examName || question.sourceInfo?.examName) && (
                        <span className="flex items-center gap-1 text-indigo-400">
                            <FileText className="w-3 h-3" />
                            {question.examName || question.sourceInfo?.examName} {question.examYear || question.sourceInfo?.examYear}
                        </span>
                    )}
                    {/* Exam Shift Detail - Now visible on all screens and beside exam name */}

                    {(question.examDateShift || question.sourceInfo?.examDateShift) && (
                        <span className="flex items-center gap-1 text-gray-400 dark:text-slate-500 border-l border-gray-200 dark:border-gray-700 pl-2 ml-1">
                            <Calendar className="w-3 h-3" />
                            {question.examDateShift || question.sourceInfo?.examDateShift}
                        </span>
                    )}
                    {isAdmin && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded ml-auto shadow-sm active:scale-95 transition-all"
                            title="Edit Question"
                        >
                            <Edit className="w-3 h-3" /> Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Question Text Area */}
            <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                    {/* Main English Text */}
                    {/* Added 'selectable-text' utility and stopPropagation to ensure text selection works on touch devices */}
                    <div 
                        className="text-gray-900 dark:text-white leading-relaxed font-poppins flex-1 selectable-text relative z-10"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <MarkdownRenderer content={question.question} />
                    </div>
                    
                    {/* Show Time Spent in Review Mode (if userTime provided) */}
                    {userTime !== undefined && (
                        <div className="flex items-center gap-1 text-[0.7em] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full whitespace-nowrap select-none self-start">
                            <Clock className="w-3 h-3" /> {userTime}s
                        </div>
                    )}
                </div>


                {/* AI Explanation Button & Copy Button - Conditionally rendered for Learning Mode */}
                {isAnswered && !isMockMode && (
                   <div className="flex justify-end items-center gap-2 -mt-2 mb-2">
                       <button
                           onClick={handleCopy}
                           className="flex items-center justify-center mt-3 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                           title="Copy Question & Options"
                        aria-label="Copy text">
                           {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                       </button>
                       <button
                           onClick={handleDownload}
                           className="flex items-center justify-center mt-3 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                           title="Download Question Card"
                        aria-label="Download file">
                           <Download className="w-4 h-4" />
                       </button>
                       <AiExplanationButton key={question.id} question={question} selectedAnswer={selectedAnswer} />
                   </div>
                )}


                {/* Hindi Translation & TTS Control */}
                {question.question_hi && (
                    <div className="flex items-start gap-3 group">
                        <div
                            className="flex-1 text-gray-800 dark:text-gray-100 font-hindi leading-relaxed border-l-4 border-indigo-100 dark:border-indigo-900/30 pl-4 selectable-text"
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            <MarkdownRenderer content={question.question_hi} />
                        </div>
                        <div className="shrink-0 pt-0.5">
                            <button
                                onClick={() => {
                                    if (isPlaying) {
                                        stop();
                                    } else {
                                        // Strip HTML from Hindi text before sending to TTS engine
                                        const tempDiv = document.createElement('div');
                                        tempDiv.innerHTML = question.question_hi || '';
                                        const textContent = tempDiv.textContent || tempDiv.innerText || '';
                                        speak(textContent);
                                    }
                                }}
                                disabled={isLoading}
                                className={`p-2 rounded-full transition-all shadow-sm border ${
                                    isPlaying
                                        ? 'text-red-600 dark:text-red-400 bg-red-100 border-red-200 hover:bg-red-200 shadow-red-100'
                                        : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:bg-indigo-900/40 shadow-indigo-100'
                                } active:scale-95`}
                                title={isPlaying ? "Stop reading" : "Read question in Hindi"}
                            >
                            {isLoading ? (
                                <svg className="animate-spin w-5 h-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : isPlaying ? (
                                <Square className="w-5 h-5 fill-current" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Options Grid */}
            <div className="grid gap-3">
                {question.options.map((option, index) => (
                    <QuizOption
                        key={option}
                        option={option}
                        option_hi={question.options_hi?.[index]}
                        isSelected={selectedAnswer === option}
                        isCorrect={option === question.correct}
                        isAnswered={isAnswered}
                        isHidden={hiddenOptions.includes(option)}
                        isMockMode={isMockMode}
                        onClick={() => onAnswerSelect(option)}
                    />
                ))}
            </div>
          {isAdmin && (
                <AdminEditQuestionModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    question={question}
                />
            )}
        </div>
    );
}
