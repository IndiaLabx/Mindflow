import React, { useRef, useEffect, useState } from 'react';
import { Send, Loader2, Mic, Image as ImageIcon, X, StopCircle, ChevronUp, AudioWaveform, Paperclip, FileText } from 'lucide-react';
import { processFile, ProcessedDocument } from './utils/fileProcessing';
import { MODEL_CONFIGS } from './useQuota';
import { cn } from '../../../utils/cn';
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
 activeModel?: string;
 setActiveModel?: (modelId: any) => void;
 value: string;
 onChange: (val: string) => void;
 onSubmit: (image?: string, audio?: { data: string, mimeType: string }, documents?: ProcessedDocument[]) => void;
 isLoading: boolean;
 disabled?: boolean;
 onStopGenerating?: () => void;
 onStartLiveTalk?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
 activeModel,
 setActiveModel,
 value,
 onChange,
 onSubmit,
 isLoading,
 disabled,
 onStopGenerating,
 onStartLiveTalk
}) => {
 const textareaRef = useRef<HTMLTextAreaElement>(null);
 const [isListening, setIsListening] = useState(false);
 const [imagePreview, setImagePreview] = useState<string | null>(null);
 const [attachedDocs, setAttachedDocs] = useState<ProcessedDocument[]>([]);
 const [isProcessingFile, setIsProcessingFile] = useState(false);
 const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const audioChunksRef = useRef<Blob[]>([]);

 const handleMicClick = async () => {
 if (isListening) {
 if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
 mediaRecorderRef.current.stop();
 }
 setIsListening(false);
 return;
 }

 try {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 const mediaRecorder = new MediaRecorder(stream);
 mediaRecorderRef.current = mediaRecorder;
 audioChunksRef.current = [];

 mediaRecorder.ondataavailable = (event) => {
 if (event.data.size > 0) {
 audioChunksRef.current.push(event.data);
 }
 };

 mediaRecorder.onstop = () => {
 const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
 const reader = new FileReader();
 reader.readAsDataURL(audioBlob);
 reader.onloadend = () => {
 const base64AudioMessage = reader.result as string;
 // Remove the data URL prefix to get raw base64
 const base64Data = base64AudioMessage.split(',')[1];
 onSubmit(undefined, { data: base64Data, mimeType: 'audio/webm' });
 };
 // Stop all audio tracks to turn off the microphone light
 stream.getTracks().forEach(track => track.stop());
 };

 mediaRecorder.start();
 setIsListening(true);
 } catch (error) {
 console.error("Error accessing microphone:", error);
 alert("Could not access microphone. Please check your permissions.");
 setIsListening(false);
 }
 };

 const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = Array.from(e.target.files || []);
 if (files.length === 0) return;

 setIsProcessingFile(true);
 try {
 const newDocs: ProcessedDocument[] = [];
 for (const file of files) {
 const processed = await processFile(file);
 newDocs.push(processed);
 }
 setAttachedDocs(prev => [...prev, ...newDocs]);
 } catch (error: any) {
 alert(error.message || "Failed to process file.");
 } finally {
 setIsProcessingFile(false);
 if (e.target) e.target.value = ''; // Reset input
 }
 };

 const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 const reader = new FileReader();
 reader.onloadend = () => {
 setImagePreview(reader.result as string);
 };
 reader.readAsDataURL(file);
 };

 const handleSend = () => {
 if (!value.trim() && !imagePreview && attachedDocs.length === 0) return;
 onSubmit(imagePreview || undefined, undefined, attachedDocs);
 setImagePreview(null);
 setAttachedDocs([]);
 };

 useEffect(() => {
 if (textareaRef.current) {
 textareaRef.current.style.height = 'auto';
 const scrollHeight = textareaRef.current.scrollHeight;
 textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
 textareaRef.current.style.overflowY = scrollHeight > 200 ? 'auto' : 'hidden';
 }
 }, [value]);

 const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 if ((value.trim() || attachedDocs.length > 0) && !isLoading && !disabled) {
 handleSend();
 }
 }
 };

 return (
 <div className="mx-auto w-full max-w-3xl px-4 py-4">
 {isLoading && onStopGenerating && (
 <div className="flex justify-center mb-4">
 <button
 onClick={onStopGenerating}
 className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 :bg-red-900/40 transition-colors text-sm font-medium border border-red-200 shadow-sm"
 >
 <StopCircle className="h-4 w-4" />
 Stop Generating
 </button>
 </div>
 )}

 {attachedDocs.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-3">
 {attachedDocs.map((doc, idx) => (
 <div key={idx} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-200 shadow-sm animate-fade-in">
 <FileText className="h-4 w-4" />
 <span className="max-w-[150px] truncate">{doc.name}</span>
 <button
 onClick={() => setAttachedDocs(prev => prev.filter((_, i) => i !== idx))}
 className="hover:bg-indigo-200 :bg-indigo-800 p-0.5 rounded-full transition-colors"
 >
 <X className="h-3 w-3" />
 </button>
 </div>
 ))}
 </div>
 )}

 {imagePreview && (
 <div className="relative inline-block mb-3">
 <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-indigo-500 shadow-md">
 <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
 </div>
 <button
 onClick={() => setImagePreview(null)}
 className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 shadow-sm hover:bg-red-500 transition-colors z-10"
 >
 <X className="h-3 w-3" />
 </button>
 </div>
 )}

 {isListening && (
 <div className="flex items-center justify-center gap-1 mb-3 bg-red-50 py-2 px-4 rounded-full border border-red-200 w-fit mx-auto animate-fade-in shadow-sm">
 <span className="text-red-500 font-medium text-sm mr-2 animate-pulse">Recording</span>
 <div className="flex gap-1 items-end h-4">
 <motion.div animate={{ height: ["40%", "100%", "40%"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} className="w-1 bg-red-500 rounded-full" />
 <motion.div animate={{ height: ["20%", "80%", "20%"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} className="w-1 bg-red-500 rounded-full" />
 <motion.div animate={{ height: ["60%", "100%", "60%"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="w-1 bg-red-500 rounded-full" />
 <motion.div animate={{ height: ["30%", "70%", "30%"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.1 }} className="w-1 bg-red-500 rounded-full" />
 <motion.div animate={{ height: ["50%", "90%", "50%"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} className="w-1 bg-red-500 rounded-full" />
 </div>
 </div>
 )}

 <div className="relative flex w-full flex-col gap-1 rounded-[24px] bg-white/70 backdrop-blur-md px-4 py-2 ring-1 ring-gray-200/50 focus-within:ring-2 focus-within:ring-indigo-500/50 shadow-sm transition-shadow">
 <textarea
 ref={textareaRef}
 value={value}
 onChange={(e) => onChange(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder="Ask MindFlow..."
 className="max-h-[200px] min-h-[44px] w-full resize-none border-0 bg-transparent py-2 text-gray-900 placeholder:text-gray-500 focus:ring-0 outline-none focus:outline-none :text-gray-400 sm:text-base leading-relaxed transition-[height] duration-100 ease-out scrollbar-hide"
 rows={1}
 disabled={isLoading || disabled}
 />
 <div className="flex items-center justify-between w-full mt-1">
 {/* Left: Image Upload */}
 <div className="flex items-center text-gray-400">

 <label className="p-2 hover:text-indigo-600 :text-indigo-400 cursor-pointer rounded-full transition-colors" title="Attach Document (PDF, DOCX, TXT)">
 <input
 type="file"
 accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
 multiple
 className="hidden text-base"
 onChange={handleDocumentUpload}
 disabled={isLoading || disabled || isProcessingFile}
 />
 {isProcessingFile ? <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> : <Paperclip className="h-5 w-5" />}
 </label>

 <label className="p-2 hover:text-indigo-600 :text-indigo-400 cursor-pointer rounded-full transition-colors">
 <input
 type="file"
 accept="image/*"
 className="hidden text-base"
 onChange={handleImageUpload}
 disabled={isLoading || disabled}
 />
 <ImageIcon className="h-5 w-5" />
 </label>
 </div>

 {/* Right: Dynamic Action Button & Model Switcher */}
 <div className="flex items-center gap-1">
 {/* Model Switcher Button */}
 {activeModel && setActiveModel && (
 <button
 onClick={() => setIsModelSheetOpen(true)}
 disabled={isLoading || disabled}
 className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 :bg-gray-800 rounded-full transition-colors"
 >
 <span className="truncate max-w-[60px]">{MODEL_CONFIGS[activeModel as keyof typeof MODEL_CONFIGS]?.displayName || 'Model'}</span>
 <ChevronUp className="h-3 w-3" />
 </button>
 )}

 {/* Live Talk Button */}
 {!value.trim() && !imagePreview && !isLoading && !isListening && onStartLiveTalk && (
 <button
 onClick={onStartLiveTalk}
 disabled={disabled}
 className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 :bg-emerald-900/40"
 title="Live Talk"
  aria-label="Toggle connection">
 <AudioWaveform className="h-5 w-5" />
 </button>
 )}

 {/* Dynamic Action Button */}
 <button
 onClick={() => {
 if (isLoading && onStopGenerating) {
 onStopGenerating();
 } else if (value.trim() || imagePreview || attachedDocs.length > 0) {
 handleSend();
 } else {
 handleMicClick();
 }
 }}
 disabled={disabled && !isLoading}
 className={cn(
 "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200",
 isLoading
 ? "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20"
 : (value.trim() || imagePreview || attachedDocs.length > 0)
 ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
 : isListening
 ? "bg-red-50 text-red-500 "
 : "bg-gray-100 text-gray-500 hover:bg-gray-200 :bg-gray-700"
 )}
 title={isLoading ? "Stop generating" : (value.trim() || imagePreview || attachedDocs.length > 0) ? "Send message" : (isListening ? "Stop recording" : "Record voice")}
 >
 {isLoading ? (
 <StopCircle className="h-5 w-5" />
 ) : (value.trim() || imagePreview) ? (
 <Send className="h-4 w-4 ml-0.5" />
 ) : isListening ? (
 <Mic className="h-5 w-5 animate-pulse" />
 ) : (
 <Mic className="h-5 w-5" />
 )}
 </button>
 </div>
 </div>
 </div>

 {/* Bottom Sheet Model Switcher */}
 <AnimatePresence>
 {isModelSheetOpen && activeModel && setActiveModel && (
 <>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[60] bg-black/50"
 onClick={() => setIsModelSheetOpen(false)}
 />
 <motion.div
 initial={{ y: "100%" }}
 animate={{ y: 0 }}
 exit={{ y: "100%" }}
 transition={{ type: "spring", damping: 25, stiffness: 200 }}
 className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
 >
 <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
 <h3 className="text-lg font-semibold text-gray-900 ">Select AI Model</h3>
 <button
 onClick={() => setIsModelSheetOpen(false)}
 className="p-2 text-gray-400 hover:text-gray-600 :text-gray-200 rounded-full hover:bg-gray-100 :bg-gray-800 transition-colors"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 <div className="p-4 overflow-y-auto space-y-2 pb-8">
 {Object.values(MODEL_CONFIGS).map(m => (
 <button
 key={m.id}
 onClick={() => {
 setActiveModel(m.id);
 setIsModelSheetOpen(false);
 }}
 className={cn(
 "w-full flex items-center justify-between p-4 rounded-xl text-left transition-colors border",
 activeModel === m.id
 ? "border-indigo-500 bg-indigo-50 text-indigo-700 "
 : "border-transparent bg-gray-50 hover:bg-gray-100 :bg-gray-100 text-gray-700 "
 )}
 >
 <div>
 <div className="font-medium">{m.displayName}</div>
 <div className="text-xs opacity-70 mt-1">Limit: {m.rpd} req/day • {m.rpm} req/min</div>
 </div>
 {activeModel === m.id && (
 <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
 )}
 </button>
 ))}
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 <div className="mt-2 text-center text-xs text-gray-500 ">
 AI can make mistakes. Verify important information.
 </div>
 </div>
 );
};
