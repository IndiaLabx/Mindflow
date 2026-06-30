import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import { Bot, User, Copy, Check, Volume2, RotateCcw, Brain, Edit2, FileText } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { cn } from '../../../utils/cn';
import { AIChatMessage } from '../../../lib/db';

interface ChatMessageProps {
 isGenerating?: boolean;
 message: AIChatMessage;
 onRegenerate?: () => void;
 onEdit?: (messageId: string, newContent: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate, isGenerating, onEdit }) => {
 const isUser = message.role === 'user';
 const [isCopied, setIsCopied] = useState(false);
 const [isPlaying, setIsPlaying] = useState(false);
 const [isEditing, setIsEditing] = useState(false);
 const [editValue, setEditValue] = useState(message.content);

 const handleCopy = () => {
 navigator.clipboard.writeText(message.content);
 setIsCopied(true);
 setTimeout(() => setIsCopied(false), 2000);
 };

 const handleTTS = () => {
 if (!window.speechSynthesis) return;

 if (isPlaying) {
 window.speechSynthesis.cancel();
 setIsPlaying(false);
 return;
 }

 const utterance = new SpeechSynthesisUtterance(message.content);
 utterance.rate = 1.0;
 utterance.pitch = 1.0;

 utterance.onend = () => setIsPlaying(false);
 utterance.onerror = () => setIsPlaying(false);

 setIsPlaying(true);
 window.speechSynthesis.speak(utterance);
 };

 // Helper function to format timestamp
 const formatTime = (isoString: string) => {
 const date = new Date(isoString);
 let hours = date.getHours();
 const minutes = date.getMinutes();
 const ampm = hours >= 12 ? 'pm' : 'am';
 hours = hours % 12;
 hours = hours ? hours : 12; // the hour '0' should be '12'
 const minutesStr = minutes < 10 ? '0' + minutes : minutes;
 return `${hours}:${minutesStr} ${ampm}`;
 };

 const timestamp = message.created_at ? formatTime(message.created_at) : '';

 return (
 <div className={cn(
 "flex w-full px-4 py-2", // Reduced padding for bubble style
 isUser ? "justify-end" : "justify-start"
 )}>
 <div className={cn(
 "flex max-w-[85%] md:max-w-[75%] gap-3 items-start",
 isUser ? "flex-row-reverse" : "flex-row"
 )}>
 <div className="flex-shrink-0 mb-1">
 {isUser ? (
 <div className="hidden">
 <User className="h-5 w-5 text-white" />
 </div>
 ) : (
 <div className={cn(
 "flex h-7 w-7 items-center justify-center rounded-full overflow-hidden shrink-0 mt-1",
 "bg-indigo-100 text-indigo-600 ",
 isGenerating ? "animate-pulse" : "" // We'll add custom throbbing class if needed, but animate-pulse + spin works well
 )}>
 <Brain className={cn(
 "h-4 w-4",
 isGenerating ? "animate-[spin_3s_linear_infinite,pulse_1.5s_ease-in-out_infinite]" : ""
 )} />
 </div>
 )}
 </div>

 <div className={cn(
 "group relative flex flex-col min-w-0 py-2",
 isUser
 ? "bg-indigo-50 text-gray-900 rounded-[20px] rounded-br-[4px] px-4 shadow-sm" // User Bubble
 : "bg-transparent text-gray-900 " // AI Borderless
 )}>
 {message.documents && message.documents.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-3">
 {message.documents.map((doc: any, idx: number) => (
 <div key={idx} className={cn(
 "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border shadow-sm",
 isUser
 ? "bg-white/20 text-gray-900 border-white/30"
 : "bg-indigo-50 text-indigo-700 border-indigo-200 "
 )}>
 <FileText className="h-4 w-4" />
 <span className="max-w-[150px] truncate">{doc.name}</span>
 </div>
 ))}
 </div>
 )}

 {message.image && (
 <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 max-w-sm">
 <img src={message.image} alt="Attached" className="w-full h-auto max-h-64 object-cover" />
 </div>
 )}

 {isEditing ? (
 <div className="flex flex-col gap-2 w-full mt-2 min-w-[200px] sm:min-w-[300px]">
 <textarea
 value={editValue}
 onChange={(e) => setEditValue(e.target.value)}
 className="w-full resize-none rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
 rows={Math.max(3, editValue.split('\n').length)}
 autoFocus
 />
 <div className="flex justify-end gap-2">
 <button
 onClick={() => {
 setIsEditing(false);
 setEditValue(message.content);
 }}
 className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 :bg-gray-100 rounded-md transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={() => {
 if (editValue.trim() !== message.content && onEdit) {
 onEdit(message.id, editValue.trim());
 }
 setIsEditing(false);
 }}
 className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
 >
 Save & Submit
 </button>
 </div>
 </div>
 ) : (
 <div className={cn(
 "prose prose-sm md:prose-base max-w-none break-words",
 ""
 )}>
 <ReactMarkdown
 remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
 rehypePlugins={[rehypeKatex]}
 components={{
 a: ({ node, ...props }) => <a {...props} className={cn(isUser ? "text-blue-600 hover:text-blue-500" : "text-indigo-600 hover:text-indigo-500 ")} target="_blank" rel="noopener noreferrer" />,
 table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className={cn("min-w-full divide-y rounded-lg border", isUser ? "divide-gray-400 border-gray-400" : "divide-gray-300 border-gray-200 ")} {...props} /></div>,
 thead: ({ node, ...props }) => <thead className={isUser ? "bg-black/5" : "bg-gray-50 "} {...props} />,
 tbody: ({ node, ...props }) => <tbody className={cn("divide-y", isUser ? "divide-gray-400 bg-transparent" : "divide-gray-200 bg-white ")} {...props} />,
 tr: ({ node, ...props }) => <tr className={cn("transition-colors", isUser ? "hover:bg-black/5" : "hover:bg-gray-50 :bg-gray-800/50")} {...props} />,
 th: ({ node, ...props }) => <th className={cn("px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider", isUser ? "text-gray-800 " : "text-gray-900 ")} {...props} />,
 td: ({ node, ...props }) => <td className={cn("px-3 py-4 text-sm whitespace-pre-wrap", isUser ? "text-gray-800 " : "text-gray-700 ")} {...props} />,
 code({ node, className, children, ...props }: any) {
 const match = /language-(w+)/.exec(className || '');
 return match ? (
 <SyntaxHighlighter
 {...props}
 style={vscDarkPlus}
 language={match[1]}
 PreTag="div"
 className="rounded-md my-4 shadow-sm"
 >
 {String(children).replace(/\n$/, '')}
 </SyntaxHighlighter>
 ) : (
 <code {...props} className={cn("px-1.5 py-0.5 rounded-md text-sm", isUser ? "bg-black/10 text-gray-900 " : "bg-gray-100 text-indigo-600 ", className)}>
 {children}
 </code>
 );
 },
 p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />
 }}
 >
 {message.content + (isGenerating ? " ●" : "")}
 </ReactMarkdown>
 </div>
 )}

 <div className={cn(
 "flex items-center mt-1 space-x-2 text-[10px]",
 isUser ? "justify-end text-gray-500 " : "justify-between text-gray-500 "
 )}>
 {/* Action Bar for User Messages */}
 {isUser && onEdit && !isEditing && (
 <div className="flex items-center gap-1">
 <button
 onClick={() => setIsEditing(true)}
 className="rounded p-1 hover:bg-indigo-100 :bg-indigo-800/50 transition-colors opacity-0 group-hover:opacity-100"
 title="Edit message"
 >
 <Edit2 className="h-3 w-3" />
 </button>
 </div>
 )}
 {/* Action Bar for AI Messages */}
 {!isUser && message.content && (
 <div className="flex items-center gap-1">
 <button
 onClick={handleCopy}
 className="rounded p-1 hover:bg-gray-100 :bg-gray-700 transition-colors"
 title="Copy message"
  aria-label="Copy text">
 {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
 </button>
 <button
 onClick={handleTTS}
 className={cn(
 "rounded p-1 hover:bg-gray-100 :bg-gray-700 transition-colors",
 isPlaying && "text-indigo-600 bg-indigo-50 "
 )}
 title={isPlaying ? "Stop listening" : "Listen"}
  aria-label="Play audio">
 <Volume2 className="h-3 w-3" />
 </button>
 {onRegenerate && (
 <button
 onClick={onRegenerate}
 className="rounded p-1 hover:bg-gray-100 :bg-gray-700 transition-colors"
 title="Regenerate response"
  aria-label="Regenerate response">
 <RotateCcw className="h-3 w-3" />
 </button>
 )}
 </div>
 )}
 {/* Timestamp */}
 {timestamp && (
 <span className={cn(
 "flex-shrink-0 pt-1",
 !isUser && "ml-auto" // Push timestamp to right in AI bubble
 )}>
 {timestamp}
 </span>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};
