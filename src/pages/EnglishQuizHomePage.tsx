import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
import { IdiomsSVG, OwsSVG, SynonymsSVG } from "@/features/quiz";
import { useNavSpinner } from "@/hooks/useNavSpinner";

interface EnglishQuizHomeProps {
  onBack: () => void;
  onIdiomsClick: () => void;
  onOWSClick: () => void;
  onSynonymsClick?: () => void;
}

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

export const EnglishQuizHomePage: React.FC<EnglishQuizHomeProps> = ({
  onBack,
  onIdiomsClick,
  onOWSClick,
  onSynonymsClick,
}) => {
  const { loadingId, handleNavigation } = useNavSpinner();

  const vocabItems = [
    {
      id: "idioms",
      title: "Idioms & Phrases",
      description: "Master common expressions and hidden meanings.",
      SvgComponent: IdiomsSVG,
      colorTheme: "amber",
      action: onIdiomsClick,
    },
    {
      id: "ows",
      title: "One Word Substitution",
      description: "Learn single words replacing entire phrases.",
      SvgComponent: OwsSVG,
      colorTheme: "purple",
      action: onOWSClick,
    },
    {
      id: "synonyms",
      title: "Synonyms & Antonyms Master",
      description: "Master words through grouped clusters.",
      SvgComponent: SynonymsSVG,
      colorTheme: "emerald",
      action: onSynonymsClick,
      badgeText: "New",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden">
      <div className="flex-1 flex flex-col space-y-8 py-4 relative z-10 animate-fade-in w-full">
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
              English{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">
                Proficiency
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
              Master vocabulary, grammar, and comprehension with targeted
              quizzes designed for competitive exams.
            </p>
          </div>
        </header>

        <div className="w-full max-w-7xl mx-auto space-y-12 pb-12">
          {/* Section 1: Vocabulary */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Vocabulary
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Expand your word power with targeted exercises.
              </p>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
            >
              {vocabItems.map((item) => {
                let borderHover = "";
                let borderBottom = "";
                let glowColor = "";
                let textGradient = "";

                switch (item.colorTheme) {
                  case "amber":
                    borderHover =
                      "group-hover:border-amber-300 dark:group-hover:border-amber-500";
                    borderBottom =
                      "border-b-amber-200/50 dark:border-b-amber-700/50";
                    glowColor = "bg-amber-500";
                    textGradient =
                      "from-amber-600 to-amber-900 dark:from-amber-300 dark:to-amber-100";
                    break;
                  case "purple":
                    borderHover =
                      "group-hover:border-purple-300 dark:group-hover:border-purple-500";
                    borderBottom =
                      "border-b-purple-200/50 dark:border-b-purple-700/50";
                    glowColor = "bg-purple-500";
                    textGradient =
                      "from-purple-600 to-purple-900 dark:from-purple-300 dark:to-purple-100";
                    break;
                  case "emerald":
                    borderHover =
                      "group-hover:border-emerald-300 dark:group-hover:border-emerald-500";
                    borderBottom =
                      "border-b-emerald-200/50 dark:border-b-emerald-700/50";
                    glowColor = "bg-emerald-500";
                    textGradient =
                      "from-emerald-600 to-emerald-900 dark:from-emerald-300 dark:to-emerald-100";
                    break;
                }

                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      handleNavigation(item.id, item.action || (() => {}))
                    }
                    className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                    <div
                      className={`absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] ${borderBottom} ${borderHover}`}
                    ></div>
                    <div
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 ${glowColor}`}
                    ></div>

                    {loadingId === item.id ? (
                      <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                        <Loader2
                          className={`w-8 h-8 text-${item.colorTheme}-500 animate-spin drop-shadow-md`}
                        />
                      </div>
                    ) : null}

                    <div
                      className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === item.id ? "opacity-0" : "opacity-100"}`}
                    >
                      {item.badgeText && (
                        <div className="absolute top-4 right-4 z-30">
                          <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                            {item.badgeText}
                          </span>
                        </div>
                      )}

                      <motion.div
                        className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                        initial={{ scale: 0.9, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                        }}
                      >
                        <item.SvgComponent />
                      </motion.div>

                      <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                        <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                          <h3
                            className={`text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r ${textGradient}`}
                          >
                            {item.title}
                          </h3>
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>

          {/* Section 2: English Grammar */}
          <section>
            <div className="mb-6 border-t border-gray-200 dark:border-gray-800 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                English Grammar
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Master grammar rules and usage.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-gray-100 dark:border-slate-700/50 flex items-center justify-center min-h-[160px]">
              <p className="text-gray-400 dark:text-slate-500 font-medium italic">
                Coming soon...
              </p>
            </div>
          </section>

          {/* Section 3: English Mock Test */}
          <section>
            <div className="mb-6 border-t border-gray-200 dark:border-gray-800 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                English Mock Test
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Full-length tests to check your overall preparation.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-gray-100 dark:border-slate-700/50 flex items-center justify-center min-h-[160px]">
              <p className="text-gray-400 dark:text-slate-500 font-medium italic">
                Coming soon...
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
