import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, ChevronRight } from "lucide-react";
import {
  DeveloperProfileSVG,
  PrivacyPolicySVG,
  TermsOfUseSVG,
} from "./AboutSVGs";

export const AboutUs: React.FC = () => {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleNavigation = (id: string, path: string) => {
    setLoadingId(id);
    setTimeout(() => {
      navigate(path);
    }, 800);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
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
    <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-8 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">
          About MindFlow
        </h1>
      </div>

      <div className="flex-1 flex flex-col space-y-6 relative z-10 animate-fade-in w-full max-w-7xl mx-auto">
        <div className="relative text-left w-full">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-2 drop-shadow-sm">
            Legal & Information
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
            Explore our profiles, policies, and terms.
          </p>
        </div>

        {/* Grid Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 w-full z-20"
        >
          {/* Developer Profile Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              handleNavigation("dev-profile", "/about/developer-profile")
            }
            className="relative group cursor-pointer aspect-square sm:aspect-square min-h-[160px] rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-indigo-200/50 dark:border-b-indigo-700/50 group-hover:border-indigo-300 dark:group-hover:border-indigo-500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-indigo-500"></div>

            {loadingId === "dev-profile" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-center gap-1 sm:gap-3 h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "dev-profile" ? "opacity-0" : "opacity-100"}`}
            >
              <motion.div
                className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0 mb-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <DeveloperProfileSVG />
              </motion.div>
              <div className="flex flex-col items-center justify-center w-full text-center">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-900 dark:from-indigo-300 dark:to-indigo-100">
                    Developer Profile
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 sm:line-clamp-none max-w-[90%]">
                  Meet the team behind MindFlow.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Privacy Policy Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigation("privacy", "/privacy-policy")}
            className="relative group cursor-pointer aspect-square sm:aspect-square min-h-[160px] rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-emerald-200/50 dark:border-b-emerald-700/50 group-hover:border-emerald-300 dark:group-hover:border-emerald-500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-emerald-500"></div>

            {loadingId === "privacy" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-center gap-1 sm:gap-3 h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "privacy" ? "opacity-0" : "opacity-100"}`}
            >
              <motion.div
                className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0 mb-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <PrivacyPolicySVG />
              </motion.div>
              <div className="flex flex-col items-center justify-center w-full text-center">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-900 dark:from-emerald-300 dark:to-emerald-100">
                    Privacy Policy
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 sm:line-clamp-none max-w-[90%]">
                  How we protect your data.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Terms of Use Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigation("terms", "/about/terms-of-use")}
            className="relative group cursor-pointer aspect-square sm:aspect-square min-h-[160px] rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-amber-200/50 dark:border-b-amber-700/50 group-hover:border-amber-300 dark:group-hover:border-amber-500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-amber-500"></div>

            {loadingId === "terms" ? (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin drop-shadow-md" />
              </div>
            ) : null}

            <div
              className={`relative z-20 flex flex-col items-center justify-center gap-1 sm:gap-3 h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === "terms" ? "opacity-0" : "opacity-100"}`}
            >
              <motion.div
                className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0 mb-2 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <TermsOfUseSVG />
              </motion.div>
              <div className="flex flex-col items-center justify-center w-full text-center">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-900 dark:from-amber-300 dark:to-amber-100">
                    Terms of Use
                  </h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 sm:line-clamp-none max-w-[90%]">
                  Guidelines for using MindFlow.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
