import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { AdminSVG } from "@/features/admin";
import {
  McqsQuizSVG,
  EnglishZoneSVG,
  ToolsSVG,
  AnalyticsSVG,
  BookmarksSVG,
  AboutSVG,
  DownloadSVG,
} from "@/features/quiz";
import {
  ListChecks,
  FileText,
  BookOpen,
  Languages,
  Save,
  Wrench,
  BarChart2,
  Star,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { useNavSpinner } from "@/hooks/useNavSpinner";
import { Loader2 } from "lucide-react";
import { useNotification } from "@/stores/useNotificationStore";
import { isNativeApp } from "@/utils/platform";

/**
 * Props for the Dashboard component.
 */
interface DashboardProps {
  /** Callback to navigate to the English Zone. */

  /** Callback to return to the Landing Page intro. */
  onBackToIntro: () => void;
}

/**
 * The main Dashboard screen for logged-in users.
 *
 * Provides quick access to:
 * - Create New Quiz
 * - Saved Quizzes
 * - English Zone (Specialized features)
 * - Tools (Utilities like Flashcard Maker)
 * - User Guide (Static content)
 *
 * @param {DashboardProps} props - The component props.
 * @returns {JSX.Element} The rendered Dashboard.
 */
export const DashboardPage: React.FC<DashboardProps> = ({ onBackToIntro }) => {
  const navigate = useNavigate();
  const { loadingId, handleNavigation } = useNavSpinner();
  const { user } = useAuth();
  const { showToast } = useNotification();

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

  const handleDownloadClick = () => {
    window.open(
      "https://drive.google.com/drive/folders/1Owy8_qnvMOTw5WLRGLQajCiScN-dOHtF",
      "_blank",
    );
    showToast({
      message: "Your download page has been opened in next tab go and see",
      variant: "info",
      duration: 3000,
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden">
      <div className="flex-1 flex flex-col space-y-3 py-1 relative z-10 animate-fade-in w-full">
        {/* Greeting Section */}
        <div className="relative text-left w-full mb-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight drop-shadow-sm">
            Dashboard
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-snug font-medium">
            {getGreeting()},{" "}
            {user?.user_metadata?.first_name ||
              user?.user_metadata?.full_name?.split(" ")[0] ||
              "buddy"}
            !
          </p>
        </div>

        {/* --- Google Play App Banner --- */}
        {!isNativeApp() && (
        <motion.div
          variants={itemVariants}
          className="relative w-full max-w-lg mx-auto sm:ml-0 overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 cursor-pointer shadow-lg"
          onClick={() => window.open('https://play.google.com/store/apps/details?id=com.aklabxmindflow.app', '_blank')}
        >
          <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-3xl z-0"></div>
          <div className="relative z-10 flex items-center justify-between p-4 gap-3 bg-white/50 dark:bg-slate-900/50 rounded-[23px]">
            <div className="flex flex-col text-left text-slate-900 dark:text-white">
              <h2 className="text-sm sm:text-base font-bold drop-shadow-sm">Get the Android App</h2>
              <p className="text-xs font-medium opacity-90">Faster & smoother experience</p>
            </div>
            <img
              alt="Get it on Google Play"
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
              width="83" height="32" className="h-8 sm:h-10 w-auto transition-transform hover:scale-105 active:scale-95 drop-shadow-md"
            />
          </div>
        </motion.div>
        )}


        {/* --- Primary Hero Card: MCQs Quiz --- */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            handleNavigation("card-mcqs", () => navigate("/mcqs"))
          }
          className="relative group cursor-pointer w-full rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden mb-6 shadow-xl"
        >
          {/* Deep Premium Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/20 via-purple-600/10 to-fuchsia-900/40 dark:from-fuchsia-900/40 dark:via-purple-900/20 dark:to-fuchsia-950/60 backdrop-blur-2xl transition-colors duration-300 z-0"></div>

          {/* Subtle light overlay */}
          <div className="absolute inset-0 bg-white/30 dark:bg-black/20 z-0"></div>

          {/* Interactive Inner Shadow / Premium Border */}
          <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-fuchsia-200/60 dark:border-fuchsia-700/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[6px] border-b-fuchsia-400/50 dark:border-b-fuchsia-600/50 group-hover:border-fuchsia-300 dark:group-hover:border-fuchsia-400"></div>

          {/* Centered Large Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-fuchsia-500 pointer-events-none"></div>

          {loadingId === "card-mcqs" ? (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/30 dark:bg-black/40 backdrop-blur-md rounded-[32px] sm:rounded-[40px]">
              <Loader2 className="w-10 h-10 text-fuchsia-600 dark:text-fuchsia-400 animate-spin drop-shadow-lg" />
            </div>
          ) : null}

          <div
            className={`relative z-20 flex flex-col items-center justify-center h-full w-full p-8 sm:p-10 transition-opacity duration-300 ${loadingId === "card-mcqs" ? "opacity-0" : "opacity-100"}`}
          >
            {/* Top Area: SVG Container */}
            <motion.div
              className="w-24 h-24 sm:w-32 sm:h-32 mb-4 relative drop-shadow-2xl"
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <McqsQuizSVG />
            </motion.div>

            {/* Middle Area: Text */}
            <div className="flex flex-col items-center justify-center w-full text-center mb-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-700 to-purple-900 dark:from-fuchsia-300 dark:to-purple-100 drop-shadow-sm mb-2">
                MCQs Quiz
              </h2>
              <p className="text-fuchsia-900/70 dark:text-fuchsia-100/70 text-sm sm:text-base font-bold leading-tight max-w-[80%]">
                Create, resume, or review tests
              </p>
            </div>

            {/* Bottom Area: CTA Button */}
            <div className="flex items-center justify-center bg-fuchsia-600 hover:bg-fuchsia-500 active:bg-fuchsia-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full shadow-[0_4px_14px_0_rgba(192,38,211,0.39)] transition-all transform hover:scale-105 active:scale-95 gap-2 backdrop-blur-sm border border-fuchsia-400/50">
              <span className="text-sm sm:text-base tracking-wide">Start Practicing Now</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl mx-auto z-20"
        >
          {/* Card card-3 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              handleNavigation("card-3", () => navigate("/english"))
            }
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            {/* Glow Background Layer */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

            {/* Interactive Inner Shadow / Border */}
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[2px] border-b-rose-200/50 dark:border-b-rose-700/50 group-hover:border-rose-300 dark:group-hover:border-rose-500"></div>

            {/* Centered Subtle Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-rose-500"></div>

            {loadingId === "card-3" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "card-3" ? "opacity-0" : "opacity-100"}`}
            >
              {/* SVG Container */}
              <motion.div
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <EnglishZoneSVG />
              </motion.div>

              {/* Text Area */}
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100">
                    English Zone
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                  Vocab, Grammar & Mock Tests.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card card-4 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigation("card-4", () => navigate("/tools"))}
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            {/* Glow Background Layer */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

            {/* Interactive Inner Shadow / Border */}
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[2px] border-b-amber-200/50 dark:border-b-amber-700/50 group-hover:border-amber-300 dark:group-hover:border-amber-500"></div>

            {/* Centered Subtle Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-amber-500"></div>

            {loadingId === "card-4" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "card-4" ? "opacity-0" : "opacity-100"}`}
            >
              {/* SVG Container */}
              <motion.div
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <ToolsSVG />
              </motion.div>

              {/* Text Area */}
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-900 dark:from-amber-300 dark:to-amber-100">
                    Tools
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                  Flashcard Maker & Utilities.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card card-5 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              handleNavigation("card-5", () => navigate("/quiz/analytics"))
            }
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            {/* Glow Background Layer */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

            {/* Interactive Inner Shadow / Border */}
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[2px] border-b-blue-200/50 dark:border-b-blue-700/50 group-hover:border-blue-300 dark:group-hover:border-blue-500"></div>

            {/* Centered Subtle Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-blue-500"></div>

            {loadingId === "card-5" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "card-5" ? "opacity-0" : "opacity-100"}`}
            >
              {/* SVG Container */}
              <motion.div
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <AnalyticsSVG />
              </motion.div>

              {/* Text Area */}
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-900 dark:from-blue-300 dark:to-blue-100">
                    Analytics
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                  Detailed report cards & stats.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card card-6 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              handleNavigation("card-6", () => navigate("/quiz/bookmarks"))
            }
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            {/* Glow Background Layer */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

            {/* Interactive Inner Shadow / Border */}
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-violet-200/50 dark:border-b-violet-700/50 group-hover:border-violet-300 dark:group-hover:border-violet-500"></div>

            {/* Centered Subtle Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-violet-500"></div>

            {loadingId === "card-6" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "card-6" ? "opacity-0" : "opacity-100"}`}
            >
              {/* SVG Container */}
              <motion.div
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <BookmarksSVG />
              </motion.div>

              {/* Text Area */}
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-violet-900 dark:from-violet-300 dark:to-violet-100">
                    Bookmarks
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                  Review your saved questions.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Admin Room (Visible only to admin@mindflow.com) */}
          {user?.email === "admin@mindflow.com" && (
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                handleNavigation("card-admin", () => navigate("/admin"))
              }
              className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
              <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[2px] border-b-red-200/50 dark:border-b-red-700/50 group-hover:border-red-300 dark:group-hover:border-red-500"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-red-500"></div>

              {loadingId === "card-admin" ? (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin drop-shadow-md" />
                </div>
              ) : null}

              <div
                className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "card-admin" ? "opacity-0" : "opacity-100"}`}
              >
                <motion.div
                  className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <AdminSVG />
                </motion.div>

                <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                  <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                    <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-900 dark:from-red-300 dark:to-red-100">
                      Admin Room
                    </h3>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                    Broadcast & Upload
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Card card-download */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              handleNavigation("card-download", handleDownloadClick)
            }
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            {/* Glow Background Layer */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

            {/* Interactive Inner Shadow / Border */}
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[2px] border-b-cyan-200/50 dark:border-b-cyan-700/50 group-hover:border-cyan-300 dark:group-hover:border-cyan-500"></div>

            {/* Centered Subtle Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-cyan-500"></div>

            {loadingId === "card-download" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "card-download" ? "opacity-0" : "opacity-100"}`}
            >
              {/* SVG Container */}
              <motion.div
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <DownloadSVG />
              </motion.div>

              {/* Text Area */}
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-cyan-900 dark:from-cyan-300 dark:to-cyan-100">
                    Download
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                  Get study materials & PDFs.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card card-7 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigation("card-7", () => navigate("/about"))}
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            {/* Glow Background Layer */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

            {/* Interactive Inner Shadow / Border */}
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[2px] border-b-slate-200/50 dark:border-b-slate-700/50 group-hover:border-slate-300 dark:group-hover:border-slate-500"></div>

            {/* Centered Subtle Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-slate-500"></div>

            {loadingId === "card-7" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-slate-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "card-7" ? "opacity-0" : "opacity-100"}`}
            >
              {/* SVG Container */}
              <motion.div
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring" as const,
                  stiffness: 200,
                  damping: 20,
                }}
              >
                <AboutSVG />
              </motion.div>

              {/* Text Area */}
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-900 dark:from-slate-300 dark:to-slate-100">
                    About Us
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                  Developer info, Privacy Policy & Terms.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer Link */}
        <div className="w-full text-center pb-4">
          <button
            onClick={onBackToIntro}
            className="text-xs text-gray-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 font-semibold uppercase tracking-widest"
          >
            Back to Intro
          </button>
        </div>
      </div>
    </div>
  );
};
