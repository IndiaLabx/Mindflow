import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ChevronRight } from "lucide-react";
import { DownloadSVG } from "@/features/school";

export const SchoolHomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 w-full flex flex-col relative overflow-hidden -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* Fluid Background Layers */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-blob z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-blob animation-delay-2000 z-0" />
      <div className="absolute bottom-[-20%] left-[10%] w-[70vw] h-[70vw] bg-pink-500/20 dark:bg-pink-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-blob animation-delay-4000 z-0" />

      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit mb-4"
        >
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
          Back to Dashboard
        </button>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 mt-4 text-center"
        >
          <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 shadow-inner mb-4 sm:mb-6">
            <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 tracking-tight leading-tight">
            School Zone
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto font-medium">
            CBSE notes, NCERT solutions, chapter tests, and more.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Download Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/school/download")}
            className="relative group cursor-pointer w-full min-h-[120px] rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            {/* Glow Background Layer */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

            {/* Interactive Inner Shadow / Border */}
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-cyan-200/50 dark:border-b-cyan-700/50 group-hover:border-cyan-300 dark:group-hover:border-cyan-500"></div>

            {/* Centered Subtle Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-cyan-500"></div>

            <div className="relative z-20 flex flex-row items-center justify-start gap-4 sm:gap-6 h-full w-full p-4 sm:p-6">
              {/* SVG Container */}
              <motion.div
                className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative drop-shadow-xl"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <DownloadSVG />
              </motion.div>

              {/* Text Area */}
              <div className="flex flex-col items-start justify-center flex-1 text-left">
                <div className="flex items-center justify-start mb-1 gap-1">
                  <h3 className="text-lg sm:text-xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-cyan-900 dark:from-cyan-300 dark:to-cyan-100">
                    Download Center
                  </h3>
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold leading-snug px-0">
                  Get NCERT PDFs, study notes & question banks.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
