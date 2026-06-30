import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDown, ChevronDown, Brain, Plus, Trash2, MessageSquare, Loader2, Search, Download, Zap, Settings, X, Globe } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ChatMessage } from './ChatMessage';
import { ProcessedDocument } from './utils/fileProcessing';
import { ChatInput } from './ChatInput';
import { useAIChat } from './useAIChat';
import { MODEL_CONFIGS } from './useQuota';
import { cn } from '../../../utils/cn';
import { AIChatConversation } from '../../../lib/db';
import { useLiveAPI } from '../talk/useLiveAPI';
import { VoiceBlobVisualizer } from '../talk/VoiceBlobVisualizer';
import { Mic, MicOff, PhoneOff, Captions, AlertCircle, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const AIChatPage: React.FC = () => {
 const navigate = useNavigate();
 const {
 messages,
 conversations,
 currentConversationId,
 isLoading,
 sendMessage,
 editMessage,
 startNewConversation,
 loadConversation,
 deleteConversation,
 stopGenerating,
 includeAppData,
 setIncludeAppData,
 groundingState,
 setGroundingState,
 activeModel,
 setActiveModel,
 quota,
 appendTranscript
 } = useAIChat();

 const [inputValue, setInputValue] = useState('');
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [isSettingsOpen, setIsSettingsOpen] = useState(false);
 const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [isLiveTalkActive, setIsLiveTalkActive] = useState(false);
 const [showSubtitles, setShowSubtitles] = useState(true);
 const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
 const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
 const [showScrollButton, setShowScrollButton] = useState(false);
 const chatScrollContainerRef = useRef<HTMLDivElement>(null);

 const {
 connectionState,
 agentState,
 errorMsg,
 isMuted,
 toggleMute,
 connect,
 disconnect,
 voiceName,
 changeVoice,
 userAnalyser,
 aiAnalyser,
 currentSubtitle,
 transcript
 } = useLiveAPI();

 // Polyfill secondsElapsed for now (or remove if not needed)
 const [secondsElapsed, setSecondsElapsed] = useState(0);
 useEffect(() => {
 if (connectionState === 'connected') {
 const timer = setInterval(() => setSecondsElapsed(prev => prev + 1), 1000);
 return () => clearInterval(timer);
 } else {
 setSecondsElapsed(0);
 }
 }, [connectionState]);

 const handleToggleConnection = () => {
 if (connectionState === 'connected') {
 disconnect();
 } else {
 const initialContext = messages.slice(-10).map(m => ({
 role: m.role as 'user' | 'model',
 text: m.content
 }));
 connect(initialContext);
 }
 };

 const formatTime = (seconds: number) => {
 const m = Math.floor(seconds / 60).toString().padStart(2, '0');
 const s = (seconds % 60).toString().padStart(2, '0');
 return `${m}:${s}`;
 };

 const isActiveSpeaking = agentState === 'speaking' || agentState === 'listening';

 const getStatusText = () => {
 if (connectionState === 'connecting') return 'Connecting to MindFlow...';
 if (connectionState === 'connected') {
 if (isMuted) return 'Microphone muted';
 if (agentState === 'speaking') return 'MindFlow is speaking...';
 if (agentState === 'listening') return 'Listening...';
 return 'Connected';
 }
 if (connectionState === 'error') return 'Connection failed';
 return 'Ready to talk';
 };

 const handleStartLiveTalk = () => {
 setIsLiveTalkActive(true);
 const initialContext = messages.slice(-10).map(m => ({
 role: m.role as 'user' | 'model',
 text: m.content
 }));
 connect(initialContext);
 };

 const handleEndLiveTalk = async () => {
 if (connectionState === 'connected') {
 handleToggleConnection(); // Disconnect
 }
 setIsLiveTalkActive(false);

 if (transcript && transcript.length > 0) {
 // Wait for disconnect tasks then append
 await appendTranscript(transcript);
 }
 };


 const quickStarters = [
 "Explain quantum computing in simple terms.",
 "Give me a 5-question vocabulary quiz.",
 "How do I prepare for the UPSC exam?",
 "What are some common English idioms?"
 ];

 const messagesEndRef = useRef<HTMLDivElement>(null);

 const activeConversationTitle = useMemo(() => {
 if (!currentConversationId || messages.length === 0) return "MindFlow AI";
 const conv = conversations.find(c => c.id === currentConversationId);
 return conv?.title || "MindFlow AI";
 }, [currentConversationId, conversations, messages.length]);

 const groupedHistory = useMemo(() => {
 const today: AIChatConversation[] = [];
 const last7Days: AIChatConversation[] = [];
 const last30Days: AIChatConversation[] = [];

 const now = new Date();
 now.setHours(0, 0, 0, 0);

 const filtered = conversations.filter(c =>
 c.title.toLowerCase().includes(searchQuery.toLowerCase())
 );

 filtered.forEach(c => {
 const date = new Date(c.updated_at);
 date.setHours(0, 0, 0, 0);
 const diffTime = Math.abs(now.getTime() - date.getTime());
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

 if (diffDays === 0) {
 today.push(c);
 } else if (diffDays <= 7) {
 last7Days.push(c);
 } else {
 last30Days.push(c);
 }
 });

 return { today, last7Days, last30Days };
 }, [conversations, searchQuery]);

 const SidebarGroup = ({ title, items }: { title: string, items: AIChatConversation[] }) => {
 if (items.length === 0) return null;
 return (
 <div className="mb-6">
 <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">{title}</h3>
 <div className="space-y-1">
 {items.map((conv) => (
 <div
 key={conv.id}
 className={cn(
 "group relative flex items-center justify-between gap-2 rounded-lg p-2.5 text-sm transition-colors cursor-pointer",
 currentConversationId === conv.id
 ? "bg-indigo-50 text-indigo-900 font-medium"
 : "text-gray-700 hover:bg-gray-100 :bg-white"
 )}
 onClick={() => {
 loadConversation(conv.id);
 setIsSidebarOpen(false);
 }}
 >
 <span className="truncate flex-1">{conv.title}</span>
 <button
 onClick={(e) => {
 e.stopPropagation();
 deleteConversation(conv.id);
 }}
 className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 :bg-red-900/20 transition-all shrink-0"
 title="Delete chat"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 ))}
 </div>
 </div>
 );
 };



 const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
 const target = e.target as HTMLDivElement;
 const { scrollTop, scrollHeight, clientHeight } = target;
 // Check if user is near the bottom (within 100px)
 const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

 setAutoScrollEnabled(isNearBottom);
 setShowScrollButton(!isNearBottom);
 };

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 setAutoScrollEnabled(true);
 setShowScrollButton(false);
 };

 // Auto-scroll logic when new messages arrive or loading state changes
 useEffect(() => {
 if (autoScrollEnabled) {
 // Using a slight delay ensures DOM has updated with new content before scrolling
 setTimeout(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, 50);
 }
 }, [messages, isLoading, autoScrollEnabled]);




 const [isExporting, setIsExporting] = useState(false);
 const chatContainerRef = useRef<HTMLDivElement>(null);

 const exportToPDF = async () => {
 if (!chatContainerRef.current || messages.length === 0) return;
 setIsExporting(true);

 try {
 const canvas = await html2canvas(chatContainerRef.current, {
 scale: 2,
 useCORS: true,
 logging: false,
 backgroundColor: '#ffffff' // Force white background for PDF readability
 });

 const imgData = canvas.toDataURL('image/jpeg', 0.95);
 const JsPDFClass = jsPDF as any;
 const pdf = new JsPDFClass({
 orientation: 'portrait',
 unit: 'mm',
 format: 'a4'
 });

 const imgProps = pdf.getImageProperties(imgData);
 const pdfWidth = pdf.internal.pageSize.getWidth();
 const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

 // Handle multi-page if chat is very long
 let position = 0;
 const pageHeight = pdf.internal.pageSize.getHeight();

 while (position < pdfHeight) {
 pdf.addImage(imgData, 'JPEG', 0, -position, pdfWidth, pdfHeight);
 position += pageHeight;
 if (position < pdfHeight) {
 pdf.addPage();
 }
 }

 const title = conversations.find(c => c.id === currentConversationId)?.title || 'MindFlow_Chat';
 pdf.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
 } catch (error) {
 console.error('Failed to export PDF', error);
 } finally {
 setIsExporting(false);
 }
 };

 const handleRegenerate = () => {
 // Find the last user message
 const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
 if (lastUserMsg && !isLoading) {
 sendMessage(lastUserMsg.content);
 }
 };

 const handleSubmit = (image?: string, audio?: { data: string, mimeType: string }, documents?: ProcessedDocument[]) => {
 if ((!inputValue.trim() && !image && !audio && (!documents || documents.length === 0)) || isLoading) return;
 sendMessage(inputValue, image, audio, documents);
 setInputValue('');
 };

 return (
 <div className="absolute inset-0 z-50 flex h-[100dvh] w-[100vw] flex-col bg-white md:flex-row overflow-hidden">

 {/* Sidebar (Desktop & Mobile Slide-in) */}
 <motion.div
 initial={false}
 animate={{ x: isSidebarOpen ? 0 : "-100%" }}
 transition={{ type: "spring", damping: 25, stiffness: 200 }}
 className={cn(
 "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col shadow-xl md:shadow-none",
 "md:relative md:translate-x-0 md:!transform-none"
 )}
 >
 <div className="p-4 flex gap-2">
 <button
 onClick={startNewConversation}
 className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 hover:bg-white :bg-gray-100 transition-colors"
 >
 <Plus className="h-4 w-4" />
 New Chat
 </button>
 <button
 onClick={() => setIsSidebarOpen(false)}
 className="md:hidden p-3 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 :text-white"
 >
 <ArrowLeft className="h-4 w-4" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-2 flex flex-col">
 <div className="px-2 mb-4 sticky top-0 bg-white pt-2 pb-2 z-10">
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
 <input
 type="text"
 placeholder="Search history..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto">
 <SidebarGroup title="Today" items={groupedHistory.today} />
 <SidebarGroup title="Previous 7 Days" items={groupedHistory.last7Days} />
 <SidebarGroup title="Previous 30 Days" items={groupedHistory.last30Days} />

 {conversations.length === 0 && (
 <div className="flex flex-col items-center justify-center h-40 text-gray-500 ">
 <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
 <p className="text-sm">No recent chats</p>
 </div>
 )}
 </div>
 </div>
 </motion.div>

 {/* Mobile Sidebar Overlay */}
 <AnimatePresence>
 {isSidebarOpen && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
 onClick={() => setIsSidebarOpen(false)}
 />
 )}
 </AnimatePresence>

 {/* Main Chat Area */}
 <div className="flex flex-1 flex-col h-full min-w-0">
 {/* Header */}
 <header className="flex h-14 items-center gap-2 border-b border-gray-200 bg-white/80 px-2 sm:px-4 backdrop-blur-sm shrink-0 overflow-x-auto overflow-y-hidden no-scrollbar">
 <button
 onClick={() => navigate(-1)}
 className="rounded-full p-2 text-gray-500 hover:bg-gray-100 :bg-gray-800 :text-white transition-colors shrink-0"
 aria-label="Go back"
 >
 <ArrowLeft className="h-5 w-5" />
 </button>
 <button
 onClick={() => setIsSidebarOpen(true)}
 className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 :bg-gray-800 transition-colors shrink-0"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
 </button>

 <div className="flex items-center gap-2 shrink-0 overflow-hidden">
 <Brain className="h-5 w-5 text-indigo-600 shrink-0" />
 <span className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-md">
 {activeConversationTitle}
 </span>
 </div>

 <div className="flex-1"></div>

 <button
 onClick={() => setIsSettingsOpen(true)}
 className="rounded-full p-2 text-gray-500 hover:bg-gray-100 :bg-gray-800 :text-white transition-colors shrink-0"
 aria-label="Open settings"
 >
 <Settings className="h-5 w-5" />
 </button>
 </header>

 {/* Messages Scroll Area */}
 <div ref={chatScrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
 <div ref={chatContainerRef} className="flex flex-col min-h-full">
 {messages.length === 0 ? (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, ease: "easeOut" }}
 className="flex h-full flex-col items-center justify-center p-8 text-center"
 >
 <div className="relative mb-6">
 <motion.div
 animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
 className="absolute inset-0 bg-indigo-400/30 blur-2xl rounded-full"
 />
 <div className="relative rounded-full bg-indigo-50 p-5 ring-1 ring-indigo-100 shadow-xl shadow-indigo-500/10 ">
 <Brain className="h-10 w-10 text-indigo-600 " />
 </div>
 </div>
 <h2 className="mb-2 text-2xl font-bold text-gray-900 ">How can I help you learn today?</h2>
 <p className="max-w-md text-gray-500 mb-8">
 Ask a question, request an explanation, or practice your vocabulary with MindFlow AI.
 </p>

 <motion.div
 className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4 md:px-0"
 initial="hidden"
 animate="visible"
 variants={{
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: { staggerChildren: 0.1 }
 }
 }}
 >
 {quickStarters.map((starter, index) => (
 <motion.button
 variants={{
 hidden: { opacity: 0, y: 20 },
 visible: { opacity: 1, y: 0 }
 }}
 whileHover={{ scale: 1.02, translateY: -2 }}
 whileTap={{ scale: 0.98 }}
 key={index}
 onClick={() => {
 if (!isLoading) {
 sendMessage(starter);
 }
 }}
 className="flex items-start text-left gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 :border-indigo-700 hover:bg-indigo-50/50 :bg-indigo-900/30 transition-colors group shadow-sm hover:shadow-md"
 >
 <div className="mt-0.5 rounded-lg bg-indigo-100 p-2 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
 <MessageSquare className="h-4 w-4" />
 </div>
 <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-900 :text-indigo-300">
 {starter}
 </span>
 </motion.button>
 ))}
 </motion.div>
 </motion.div>
 ) : (
 <div className="flex flex-col pb-4">
 {messages.map((message) => (
 <ChatMessage
 key={message.id}
 message={message}
 onRegenerate={handleRegenerate}
 onEdit={editMessage}
 isGenerating={isLoading && message.id === messages[messages.length - 1].id && message.role === 'assistant'}
 />
 ))}
 {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex w-full px-4 py-6 bg-white "
 >
 <div className="mx-auto flex w-full max-w-3xl gap-4 items-start">
 <div className="flex-shrink-0">
 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 shadow-sm border border-indigo-200/50 ">
 <Brain className="h-5 w-5 text-indigo-600 " />
 </div>
 </div>
 <div className="flex items-center h-8">
 <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
 <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} className="w-2 h-2 rounded-full bg-indigo-400" />
 <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} className="w-2 h-2 rounded-full bg-indigo-400" />
 <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="w-2 h-2 rounded-full bg-indigo-400" />
 </div>
 </div>
 </div>
 </motion.div>
 )}
 <div ref={messagesEndRef} className="h-4" />
 </div>
 )}
 </div>
 </div>


 {/* Scroll to Bottom Button */}
 <AnimatePresence>
 {showScrollButton && messages.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 20 }}
 className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
 >
 <button
 onClick={scrollToBottom}
 className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-md border border-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-lg hover:bg-white :bg-gray-100 hover:text-indigo-600 :text-indigo-400 transition-colors text-sm font-medium"
 >
 <ArrowDown className="w-4 h-4 animate-bounce" />
 Jump to Bottom
 </button>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Input Area */}

 <div className="bg-gradient-to-t from-white via-white to-transparent pt-4 pb-2 px-2 shrink-0">
 <ChatInput
 value={inputValue}
 onChange={setInputValue}
 onSubmit={handleSubmit}
 isLoading={isLoading}
 onStopGenerating={stopGenerating}
 onStartLiveTalk={handleStartLiveTalk}
 activeModel={activeModel}
 setActiveModel={setActiveModel}
 />
 </div>
 </div>



 {/* Live Talk Overlay */}
 <AnimatePresence>
 {isLiveTalkActive && (
 <motion.div
 initial={{ y: "100%" }}
 animate={{ y: 0 }}
 exit={{ y: "100%" }}
 transition={{ type: "spring", damping: 25, stiffness: 200 }}
 className="absolute inset-0 z-[55] flex flex-col bg-stone-900 overflow-hidden"
 >
 <header className="flex h-14 items-center justify-between border-b border-stone-800 bg-stone-900/80 px-2 sm:px-4 backdrop-blur-sm shrink-0 relative z-50">
 <div className="flex items-center gap-2">
 <button
 onClick={handleEndLiveTalk}
 className="rounded-full p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors shrink-0"
 aria-label="Go back to chat"
 >
 <ArrowLeft className="h-5 w-5" />
 </button>
 <span className="font-semibold text-white">Live Talk</span>
 </div>

 <div className="relative">
 <button
 onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)}
 className="rounded-full p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors shrink-0"
 aria-label="Voice settings"
 >
 <Settings className="h-5 w-5" />
 </button>

 <AnimatePresence>
 {isVoiceMenuOpen && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: -10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: -10 }}
 className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-stone-700 bg-stone-800 p-2 shadow-2xl z-50"
 >
 <div className="px-2 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">Voice Identity</div>
 <div className="flex flex-col gap-1">
 {['Aoede', 'Puck', 'Fenrir', 'Kore', 'Charon'].map((v: any) => (
 <button
 key={v}
 onClick={() => {
 changeVoice(v);
 setIsVoiceMenuOpen(false);
 }}
 className={cn(
 "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
 voiceName === v ? "bg-stone-700 text-white font-medium" : "text-stone-300 hover:bg-stone-700/50"
 )}
 >
 {v}
 {voiceName === v && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
 </button>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </header>

 <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full">
 {/* Top Status Indicator */}
 <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10 w-full max-w-md px-4">
 {connectionState === 'connected' ? (
 <div className="flex items-center gap-2 bg-stone-800/80 backdrop-blur-md border border-stone-700 px-4 py-2 rounded-full shadow-lg">
 <span className={cn(
 "w-2 h-2 rounded-full animate-pulse",
 isMuted ? "bg-red-500" : "bg-emerald-500"
 )} />
 <span className="text-sm font-medium text-white tracking-widest font-mono">LIVE | {formatTime(secondsElapsed)}</span>
 </div>
 ) : connectionState === 'error' ? (
 <div className="flex items-center gap-2 text-red-400 bg-red-950/50 border border-red-900/50 px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium text-center shadow-lg">
 <AlertCircle className="w-5 h-5 shrink-0" />
 <span>{errorMsg || 'Connection failed'}</span>
 </div>
 ) : null}

 <div className={cn(
 "text-lg font-medium transition-colors duration-300 h-8 mt-2",
 connectionState === 'connected' ? (isActiveSpeaking ? "text-indigo-400 animate-pulse" : (isMuted ? "text-red-400" : "text-emerald-400")) : "text-stone-500"
 )}>
 {getStatusText()}
 </div>
 </div>

 {/* Main Visualizer Avatar Area */}
 <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10">
 <div className="relative flex items-center justify-center w-64 h-64">
 <VoiceBlobVisualizer
 userAnalyser={userAnalyser}
 aiAnalyser={aiAnalyser}
 agentState={agentState}
 connectionState={connectionState}
 isMuted={isMuted}
 />
 <button
 onClick={connectionState !== 'connected' ? handleToggleConnection : undefined}
 disabled={connectionState === 'connecting'}
 className={cn(
 "relative z-20 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform border-4 border-stone-800/80 backdrop-blur-sm",
 connectionState === 'idle' || connectionState === 'disconnected' || connectionState === 'error'
 ? "bg-stone-800 hover:bg-stone-700 hover:scale-105 cursor-pointer text-stone-300"
 : connectionState === 'connecting'
 ? "bg-stone-800 scale-95 cursor-wait"
 : isActiveSpeaking
 ? "bg-indigo-600/20 text-indigo-100 scale-100 cursor-default border-indigo-500/30"
 : isMuted ? "bg-red-600/20 text-red-100 border-red-500/30" : "bg-emerald-600/20 text-emerald-100 border-emerald-500/30"
 )}
  aria-label="Toggle connection">
 {connectionState === 'connecting' ? (
 <Loader2 className="w-12 h-12 animate-spin text-stone-400" />
 ) : connectionState === 'connected' ? (
 isActiveSpeaking ? (
 <User className="w-12 h-12 opacity-90" />
 ) : (
 <Mic className="w-12 h-12 opacity-90" />
 )
 ) : (
 <Mic className="w-12 h-12" />
 )}
 </button>
 </div>
 </div>

 {/* Subtitles Overlay */}
 <div className="w-full max-w-lg px-6 min-h-[80px] mb-8 flex flex-col items-center justify-end z-20 pointer-events-none">
 {showSubtitles && currentSubtitle && connectionState === 'connected' && (
 <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center animate-in fade-in slide-in-from-bottom-2 shadow-2xl w-full max-w-full overflow-hidden flex flex-col justify-end" style={{ maxHeight: '100px' }}>
 <div
 className="overflow-y-auto pointer-events-auto scrollbar-hide flex flex-col justify-end"
 ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
 >
 <p className="text-white text-lg font-medium leading-relaxed drop-shadow-md pb-1 whitespace-pre-wrap">
 {currentSubtitle}
 </p>
 </div>
 </div>
 )}
 </div>

 {/* Bottom Controls */}
 <div className="w-full max-w-md pb-8 z-20 flex flex-col items-center gap-6">
 {connectionState === 'connected' ? (
 <div className="flex items-center justify-center gap-6 w-full px-4 animate-in fade-in slide-in-from-bottom-4">
 <button
 onClick={() => setShowSubtitles(!showSubtitles)}
 className={cn(
 "p-4 rounded-full transition-all duration-200 shadow-lg",
 showSubtitles
 ? 'bg-stone-800 text-indigo-400 border border-indigo-900/50 hover:bg-stone-700'
 : 'bg-stone-800 text-stone-500 border border-stone-700 hover:bg-stone-700 hover:text-stone-300'
 )}
 title={showSubtitles ? "Hide Subtitles" : "Show Subtitles"}
 >
 <Captions className="w-6 h-6" />
 </button>
 <button
 onClick={handleToggleConnection}
 className="p-6 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg hover:shadow-red-900/50 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center border-4 border-stone-900"
 title="End Conversation"
  aria-label="Toggle connection">
 <PhoneOff className="w-8 h-8" />
 </button>
 <button
 onClick={toggleMute}
 className={cn(
 "p-4 rounded-full transition-all duration-200 shadow-lg border",
 isMuted
 ? 'bg-red-950/50 text-red-400 border-red-900/50 hover:bg-red-900/50'
 : 'bg-stone-800 text-emerald-400 border-emerald-900/30 hover:bg-stone-700 hover:text-emerald-300'
 )}
 title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
  aria-label="Toggle microphone">
 {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
 </button>
 </div>
 ) : (
 <>
 <button
 onClick={handleToggleConnection}
 className="bg-emerald-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-1 active:translate-y-0 w-full max-w-[280px]"
 >
 Start Connection
 </button>
 {connectionState !== 'error' && (
 <p className="text-center text-sm text-stone-500 max-w-[250px] font-medium mt-2 animate-pulse">
 Microphone test is active. Speak to test levels.
 </p>
 )}
 </>
 )}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Settings Right Sidebar */}
 <AnimatePresence>
 {isSettingsOpen && (
 <motion.div
 initial={{ x: "100%" }}
 animate={{ x: 0 }}
 exit={{ x: "100%" }}
 transition={{ type: "spring", damping: 25, stiffness: 200 }}
 className="fixed inset-y-0 right-0 z-[60] w-72 bg-white border-l border-gray-200 flex flex-col shadow-2xl"
 >
 <div className="flex items-center justify-between p-4 border-b border-gray-200 ">
 <h2 className="text-lg font-semibold text-gray-900 ">Settings</h2>
 <button
 onClick={() => setIsSettingsOpen(false)}
 className="rounded-full p-2 text-gray-500 hover:bg-gray-100 :bg-gray-800 :text-white transition-colors"
 aria-label="Close settings"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-6">
 {/* Model Selector */}
 <div className="space-y-3 relative">
 <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
 <Zap className="h-4 w-4 text-amber-500" />
 AI Model
 </label>
 <div className="relative">
 <button
 onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
 className="w-full flex items-center justify-between p-3 rounded-xl border bg-white border-gray-200 hover:border-indigo-300 :border-indigo-700 transition-colors"
 >
 <div className="flex flex-col items-start text-left">
 <span className="text-sm font-medium text-gray-900 ">
 {activeModel ? MODEL_CONFIGS[activeModel as keyof typeof MODEL_CONFIGS]?.displayName : 'Select Model'}
 </span>
 <span className="text-xs text-gray-500 mt-0.5">
 {activeModel ? `${MODEL_CONFIGS[activeModel as keyof typeof MODEL_CONFIGS]?.rpd} req/day limit` : ''}
 </span>
 </div>
 <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform duration-200", isModelDropdownOpen && "rotate-180")} />
 </button>

 <AnimatePresence>
 {isModelDropdownOpen && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.15 }}
 className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50"
 >
 <div className="max-h-60 overflow-y-auto p-1">
 {Object.values(MODEL_CONFIGS).map(m => (
 <button
 key={m.id}
 onClick={() => {
 setActiveModel(m.id as any);
 setIsModelDropdownOpen(false);
 }}
 className={cn(
 "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
 activeModel === m.id
 ? "bg-indigo-50 "
 : "hover:bg-white :bg-gray-100/50"
 )}
 >
 <div className="flex flex-col">
 <span className={cn(
 "text-sm font-medium",
 activeModel === m.id ? "text-indigo-700 " : "text-gray-700 "
 )}>
 {m.displayName}
 </span>
 <span className="text-xs text-gray-500 mt-0.5">
 {m.rpd} req/day limit
 </span>
 </div>
 {activeModel === m.id && (
 <div className="h-4 w-4 rounded-full border-2 border-indigo-500 flex items-center justify-center shrink-0">
 <div className="h-2 w-2 rounded-full bg-indigo-500" />
 </div>
 )}
 </button>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>

 {/* Grounding with Google Toggle */}
 <div className="space-y-3">
 <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
 <Globe className="h-4 w-4 text-blue-500" />
 Grounding with Google (Search)
 </label>
 <div className="flex rounded-lg border border-gray-200 bg-white p-1">
 {['auto', 'always', 'off'].map((opt) => (
 <button
 key={opt}
 onClick={() => setGroundingState(opt as any)}
 className={cn(
 "flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200",
 groundingState === opt
 ? "bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200 "
 : "text-gray-600 hover:text-gray-900 :text-gray-200"
 )}
 >
 {opt === 'auto' ? 'Auto' : opt === 'always' ? 'Always' : 'Off'}
 </button>
 ))}
 </div>
 </div>

 {/* App Context Toggle */}
 <div className="flex items-center justify-between">
 <div>
 <span className="text-sm font-medium text-gray-700 block">App Context</span>
 <span className="text-xs text-gray-500 block mt-1">Include application data in chat</span>
 </div>
 <button
 onClick={() => setIncludeAppData(!includeAppData)}
 className={cn(
 "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 :ring-offset-slate-900 shrink-0",
 includeAppData ? 'bg-indigo-600' : 'bg-gray-200 '
 )}
 >
 <span className={cn(
 "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out",
 includeAppData ? 'translate-x-6' : 'translate-x-1'
 )} />
 </button>
 </div>

 <div className="w-full h-px bg-gray-200 "></div>

 {/* Export PDF Button */}
 <div>
 <button
 onClick={() => {
 setIsSettingsOpen(false);
 exportToPDF();
 }}
 disabled={isExporting || messages.length === 0}
 className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-white :bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
 Download as PDF
 </button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Settings Overlay */}
 <AnimatePresence>
 {isSettingsOpen && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
 onClick={() => setIsSettingsOpen(false)}
 />
 )}
 </AnimatePresence>
 </div>
 );
};
