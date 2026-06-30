import React from "react";
import { motion } from "framer-motion";
import {
  CreateQuizSVG,
  SavedQuizzesSVG,
  GodModeSVG,
} from "@/features/quiz";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { useNavSpinner } from "@/hooks/useNavSpinner";
import { Loader2, ChevronRight } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";

/**
 * Props for the McqsQuizHome component.
 */
interface McqsQuizHomeProps {
  onBack: () => void;
}

export const McqsQuizHomePage: React.FC<McqsQuizHomeProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { loadingId, handleNavigation } = useNavSpinner();
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden">
      <div className="flex-1 flex flex-col space-y-6 py-4 relative z-10 animate-fade-in w-full">
        {/* Header Section */}
        <header className="relative text-left w-full mt-2 max-w-7xl mx-auto flex flex-col gap-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit"
          >
            <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
            Back to Dashboard
          </button>

          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
              MCQs Quiz
            </h1>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
              Create, resume, or review your mock tests.
            </p>
          </div>
        </header>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl mx-auto z-20"
        >
          {/* Card Create Quiz */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              handleNavigation("create-quiz", () => navigate("/quiz/config"))
            }
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            {/* Glow Background Layer */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

            {/* Interactive Inner Shadow / Border */}
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-indigo-200/50 dark:border-b-indigo-700/50 group-hover:border-indigo-300 dark:group-hover:border-indigo-500"></div>

            {/* Centered Subtle Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-indigo-500"></div>

            {loadingId === "create-quiz" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "create-quiz" ? "opacity-0" : "opacity-100"}`}
            >
              {/* SVG Container */}
              <motion.div
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <CreateQuizSVG />
              </motion.div>

              {/* Text Area */}
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-900 dark:from-indigo-300 dark:to-indigo-100">
                    Create Quiz
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                  Filter by subject, topic, and difficulty.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card Saved Quizzes */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              handleNavigation("saved-quizzes", () => navigate("/quiz/library?tab=created"))
            }
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-emerald-200/50 dark:border-b-emerald-700/50 group-hover:border-emerald-300 dark:group-hover:border-emerald-500"></div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-emerald-500"></div>

            {loadingId === "saved-quizzes" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "saved-quizzes" ? "opacity-0" : "opacity-100"}`}
            >
              <motion.div
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <SavedQuizzesSVG />
              </motion.div>

              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-900 dark:from-emerald-300 dark:to-emerald-100">
                    Saved Quizzes
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                  Resume paused quizzes or view completed ones.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card God Mode */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              handleNavigation("god-mode", () =>
                navigate("/quiz/config", { state: { initialMode: "god" } }),
              )
            }
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            {/* Glow Background Layer */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

            {/* Interactive Inner Shadow / Border */}
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-rose-200/50 dark:border-b-rose-700/50 group-hover:border-rose-300 dark:group-hover:border-rose-500"></div>

            {/* Centered Subtle Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-rose-500"></div>

            {loadingId === "god-mode" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "god-mode" ? "opacity-0" : "opacity-100"}`}
            >
              {/* SVG Container */}
              <motion.div
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <GodModeSVG />
              </motion.div>

              {/* Text Area */}
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100">
                    God-Mode
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                  Create Exam Blueprints
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer Link */}
        <div className="w-full text-center pb-4 mt-8">
          <button
            onClick={onBack}
            className="text-xs text-gray-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 font-semibold uppercase tracking-widest"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
