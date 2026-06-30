import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavSpinner } from '../../hooks/useNavSpinner';
import { Loader2, ArrowLeft, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatWithAISVG, TalkToAISVG, GenerateQuizAISVG, AIStudyPlannerSVG } from './AIHomeSVGs';

export const AIHome: React.FC = () => {
 const navigate = useNavigate();
 const { loadingId, handleNavigation } = useNavSpinner();
 const [toastMessage, setToastMessage] = useState<string | null>(null);

 const handleFeatureClick = (featureId: string, featureName: string) => {
 if (featureId === 'chat') {
 handleNavigation(featureId, () => navigate('/ai/chat'));
 } else if (featureId === 'talk') {
 handleNavigation(featureId, () => navigate('/ai/talk'));
 } else {
 setToastMessage(`"${featureName}" is coming soon!`);
 setTimeout(() => setToastMessage(null), 3000);
 }
 };

 const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: {
 staggerChildren: 0.1
 }
 }
 };

 const itemVariants = {
 hidden: { y: 20, opacity: 0 },
 visible: {
 y: 0,
 opacity: 1,
 transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
 }
 };

 return (
 <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden bg-gray-50 pb-32">

 {/* Background elements */}
 <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
 <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply animate-blob"></div>
 <div className="absolute top-[20%] -right-[10%] w-[45%] h-[45%] rounded-full bg-emerald-400/20 blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
 <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
 </div>

 <div className="flex-1 flex flex-col space-y-6 py-4 relative z-10 animate-fade-in w-full max-w-7xl mx-auto">

 {/* Header */}
 <header className="mb-8 mt-2 flex items-center gap-4 relative z-20">
 <button
 onClick={() => navigate(-1)}
 className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 :text-white :bg-gray-800 transition-colors bg-white/50 backdrop-blur-sm"
 aria-label="Go back"
 >
 <ArrowLeft className="w-6 h-6" />
 </button>
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-indigo-100/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm">
 <Brain className="w-6 h-6 text-indigo-600 " />
 </div>
 <div>
 <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
 MindFlow AI
 </h1>
 <p className="text-sm text-gray-600 font-medium">Next-gen learning tools</p>
 </div>
 </div>
 </header>

 {toastMessage && (
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg font-medium"
 >
 {toastMessage}
 </motion.div>
 )}

 {/* Cards Grid */}
 <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full z-20">

 {/* Chat with AI */}
 <motion.div
 variants={itemVariants}
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => handleFeatureClick('chat', 'Chat with AI')}
 className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
 >
 {/* Glow Background Layer */}
 <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
 <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 z-0"></div>

 {/* Interactive Inner Shadow / Border */}
 <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] [0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-blue-200/50 group-hover:border-blue-300 :border-blue-500"></div>

 {/* Centered Subtle Glow */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-blue-500"></div>

 {loadingId === 'chat' ? (
 <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
 <Loader2 className="w-8 h-8 text-blue-500 animate-spin drop-shadow-md" />
 </div>
 ) : null}

 <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'chat' ? 'opacity-0' : 'opacity-100'}`}>

 {/* SVG Container */}
 <motion.div
 className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
 initial={{ scale: 0.9, opacity: 0.8 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: "spring", stiffness: 200, damping: 20 }}
 >
 <ChatWithAISVG />
 </motion.div>

 {/* Text Area */}
 <div className="flex flex-col items-center justify-end w-full text-center pb-2">
 <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-900 mb-1 sm:mb-2">Chat with AI</h3>
 <p className="text-gray-500 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
 Ask questions & clear doubts.
 </p>
 </div>
 </div>
 </motion.div>

 {/* Talk to AI */}
 <motion.div
 variants={itemVariants}
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => handleFeatureClick('talk', 'Talk to AI')}
 className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
 >
 {/* Glow Background Layer */}
 <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
 <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 z-0"></div>

 {/* Interactive Inner Shadow / Border */}
 <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] [0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-emerald-200/50 group-hover:border-emerald-300 :border-emerald-500"></div>

 {/* Centered Subtle Glow */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-emerald-500"></div>

 {loadingId === 'talk' ? (
 <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
 <Loader2 className="w-8 h-8 text-emerald-500 animate-spin drop-shadow-md" />
 </div>
 ) : null}

 <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'talk' ? 'opacity-0' : 'opacity-100'}`}>

 {/* SVG Container */}
 <motion.div
 className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
 initial={{ scale: 0.9, opacity: 0.8 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: "spring", stiffness: 200, damping: 20 }}
 >
 <TalkToAISVG />
 </motion.div>

 {/* Text Area */}
 <div className="flex flex-col items-center justify-end w-full text-center pb-2">
 <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-900 mb-1 sm:mb-2">Talk to AI</h3>
 <p className="text-gray-500 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
 Real-time voice conversations.
 </p>
 </div>
 </div>
 </motion.div>

 {/* Generate Quiz with AI */}
 <motion.div
 variants={itemVariants}
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => handleFeatureClick('quiz', 'Generate Quiz with AI')}
 className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
 >
 {/* Glow Background Layer */}
 <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
 <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 z-0"></div>

 {/* Interactive Inner Shadow / Border */}
 <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] [0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-purple-200/50 group-hover:border-purple-300 :border-purple-500"></div>

 {/* Centered Subtle Glow */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-purple-500"></div>

 {/* Beta Badge */}
 <div className="absolute top-4 right-4 z-30">
 <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200 shadow-sm backdrop-blur-md">
 BETA
 </span>
 </div>

 {loadingId === 'quiz' ? (
 <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
 <Loader2 className="w-8 h-8 text-purple-500 animate-spin drop-shadow-md" />
 </div>
 ) : null}

 <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'quiz' ? 'opacity-0' : 'opacity-100'}`}>

 {/* SVG Container */}
 <motion.div
 className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
 initial={{ scale: 0.9, opacity: 0.8 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: "spring", stiffness: 200, damping: 20 }}
 >
 <GenerateQuizAISVG />
 </motion.div>

 {/* Text Area */}
 <div className="flex flex-col items-center justify-end w-full text-center pb-2">
 <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-900 mb-1 sm:mb-2">AI Quizzes</h3>
 <p className="text-gray-500 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
 Create quizzes in seconds.
 </p>
 </div>
 </div>
 </motion.div>

 {/* AI Study Planner */}
 <motion.div
 variants={itemVariants}
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => handleFeatureClick('planner', 'AI Study Planner')}
 className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
 >
 {/* Glow Background Layer */}
 <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
 <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 z-0"></div>

 {/* Interactive Inner Shadow / Border */}
 <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] [0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-amber-200/50 group-hover:border-amber-300 :border-amber-500"></div>

 {/* Centered Subtle Glow */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-amber-500"></div>

 {loadingId === 'planner' ? (
 <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
 <Loader2 className="w-8 h-8 text-amber-500 animate-spin drop-shadow-md" />
 </div>
 ) : null}

 <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'planner' ? 'opacity-0' : 'opacity-100'}`}>

 {/* SVG Container */}
 <motion.div
 className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
 initial={{ scale: 0.9, opacity: 0.8 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: "spring", stiffness: 200, damping: 20 }}
 >
 <AIStudyPlannerSVG />
 </motion.div>

 {/* Text Area */}
 <div className="flex flex-col items-center justify-end w-full text-center pb-2">
 <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-900 mb-1 sm:mb-2">Study Planner</h3>
 <p className="text-gray-500 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
 Smart schedules & paths.
 </p>
 </div>
 </div>
 </motion.div>

 </motion.div>
 </div>
 </div>
 );
};
