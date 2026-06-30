import React from "react";
import { useNavigate } from "react-router-dom";
import { useNavSpinner } from "../../hooks/useNavSpinner";
import { Loader2 } from "lucide-react";
import { Wrench, ArrowLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  FlashcardMakerSVG,
  BilingualPdfSVG,
  PptGeneratorSVG,
  TextExporterSVG,
} from "./ToolsSVGs";

const ToolsHome: React.FC = () => {
  const navigate = useNavigate();
  const { loadingId, handleNavigation } = useNavSpinner();

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  const tools = [
    {
      id: "text-exporter",
      title: "Text Exporter",
      description:
        "Write, preview, and export raw text or markdown to .txt, .md, and .html.",
      svg: <TextExporterSVG />,
      themeColor: "rose",
      action: () => navigate("/tools/text-exporter"),
      disabled: false,
    },
    {
      id: "flashcard-maker",
      title: "Flashcard Image Maker",
      description:
        "Create beautiful vintage-style flashcards for idioms and OWS.",
      svg: <FlashcardMakerSVG />,
      themeColor: "indigo",
      action: () => navigate("/tools/flashcard-maker"),
      disabled: false,
    },
    {
      id: "pdf-generator",
      title: "Bilingual PDF Generator",
      description:
        "Create flawless bilingual quiz PDFs from your JSON questions.",
      svg: <BilingualPdfSVG />,
      themeColor: "purple",
      action: () => navigate("/tools/bilingual-pdf-maker"),
      disabled: false,
    },
    {
      id: "ppt-generator",
      title: "GK PDF/PPT Generator",
      description:
        "Create customized PDF worksheets and PPT slides for GK Questions.",
      svg: <PptGeneratorSVG />,
      themeColor: "slate",
      action: () => navigate("/tools/quiz-pdf-ppt-generator"),
      disabled: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden bg-gray-50 dark:bg-slate-900">
      {/* Fluid Background Layers (Matching Dashboard) */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-transparent dark:from-indigo-950/20 dark:via-purple-900/10 dark:to-transparent z-0 blur-3xl opacity-70 pointer-events-none transition-colors duration-700"></div>
      <div className="absolute bottom-0 right-0 w-full h-96 bg-gradient-to-tl from-slate-50 via-indigo-50/30 to-transparent dark:from-slate-900/40 dark:via-indigo-900/10 dark:to-transparent z-0 blur-3xl opacity-60 pointer-events-none transition-colors duration-700"></div>

      <div className="flex-1 flex flex-col space-y-6 py-4 relative z-10 animate-fade-in w-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 sm:p-3 hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-md rounded-2xl text-gray-600 dark:text-gray-400 transition-all active:scale-95 shadow-sm border border-black/5 dark:border-white/5"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white flex items-center gap-3 drop-shadow-sm">
              <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 drop-shadow-md" />
              Tools & Utilities
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mt-1 leading-relaxed font-medium">
              Helper tools to enhance your content creation.
            </p>
          </div>
        </div>

        {/* Cards Grid (Dashboard Style) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full z-20 mt-4"
        >
          {tools.map((tool) => {
            // Dynamic styling based on themeColor (matching Dashboard's approach)
            let gradientFrom,
              gradientTo,
              borderColorHover,
              shadowColor,
              glowBg,
              textColor;

            if (tool.themeColor === "indigo") {
              gradientFrom = "dark:from-indigo-900/20";
              gradientTo = "dark:to-indigo-900/5";
              borderColorHover =
                "border-b-indigo-200/50 dark:border-b-indigo-700/50 group-hover:border-indigo-300 dark:group-hover:border-indigo-500";
              shadowColor = "bg-indigo-500";
              textColor =
                "from-indigo-600 to-indigo-900 dark:from-indigo-300 dark:to-indigo-100";
            } else if (tool.themeColor === "purple") {
              gradientFrom = "dark:from-purple-900/20";
              gradientTo = "dark:to-purple-900/5";
              borderColorHover =
                "border-b-purple-200/50 dark:border-b-purple-700/50 group-hover:border-purple-300 dark:group-hover:border-purple-500";
              shadowColor = "bg-purple-500";
              textColor =
                "from-purple-600 to-purple-900 dark:from-purple-300 dark:to-purple-100";
            } else if (tool.themeColor === "rose") {
              gradientFrom = "dark:from-rose-900/20";
              gradientTo = "dark:to-rose-900/5";
              borderColorHover =
                "border-b-rose-200/50 dark:border-b-rose-700/50 group-hover:border-rose-300 dark:group-hover:border-rose-500";
              shadowColor = "bg-rose-500";
              textColor =
                "from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100";
              gradientFrom = "dark:from-purple-900/20";
              gradientTo = "dark:to-purple-900/5";
              borderColorHover =
                "border-b-purple-200/50 dark:border-b-purple-700/50 group-hover:border-purple-300 dark:group-hover:border-purple-500";
              shadowColor = "bg-purple-500";
              textColor =
                "from-purple-600 to-purple-900 dark:from-purple-300 dark:to-purple-100";
            } else {
              // slate
              gradientFrom = "dark:from-slate-800/20";
              gradientTo = "dark:to-slate-800/5";
              borderColorHover =
                "border-b-slate-200/50 dark:border-b-slate-700/50 group-hover:border-slate-300 dark:group-hover:border-slate-500";
              shadowColor = "bg-slate-500";
              textColor =
                "from-slate-600 to-slate-900 dark:from-slate-300 dark:to-slate-100";
            }

            return (
              <motion.div
                key={tool.id}
                variants={itemVariants}
                whileHover={!tool.disabled ? { scale: 1.02 } : {}}
                whileTap={!tool.disabled ? { scale: 0.98 } : {}}
                onClick={
                  !tool.disabled
                    ? () => handleNavigation(tool.id, tool.action)
                    : undefined
                }
                className={`relative group aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden ${tool.disabled ? "opacity-60 cursor-not-allowed grayscale" : "cursor-pointer"}`}
              >
                {/* Glow Background Layer */}
                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 ${gradientFrom} ${gradientTo} z-0`}
                ></div>

                {/* Interactive Inner Shadow / Border */}
                {!tool.disabled && (
                  <div
                    className={`absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] ${borderColorHover}`}
                  ></div>
                )}
                {tool.disabled && (
                  <div
                    className={`absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10`}
                  ></div>
                )}

                {/* Centered Subtle Glow */}
                {!tool.disabled && (
                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 ${shadowColor}`}
                  ></div>
                )}

                {loadingId === tool.id ? (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                    <Loader2
                      className={`w-8 h-8 text-${tool.themeColor}-500 animate-spin drop-shadow-md`}
                    />
                  </div>
                ) : null}

                <div
                  className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === tool.id ? "opacity-0" : "opacity-100"}`}
                >
                  {/* SVG Container */}
                  <motion.div
                    className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                    initial={!tool.disabled ? { scale: 0.9, opacity: 0.8 } : {}}
                    animate={!tool.disabled ? { scale: 1, opacity: 1 } : {}}
                    transition={{
                      type: "spring" as const,
                      stiffness: 200,
                      damping: 20,
                    }}
                  >
                    {tool.svg}
                  </motion.div>

                  {/* Text Area */}
                  <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                    <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                      <h3
                        className={`text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r ${textColor}`}
                      >
                        {tool.title}
                      </h3>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                      {tool.description}
                    </p>
                    {tool.disabled && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded-full uppercase tracking-wider backdrop-blur-sm">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default ToolsHome;
