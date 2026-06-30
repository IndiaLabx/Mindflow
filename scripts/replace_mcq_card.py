import re

with open("src/features/quiz/components/Dashboard.tsx", "r") as f:
    content = f.read()

# Replace the specific card structure.
# First, remove it from the grid layout. We will find it starting at `{/* Card card-mcqs */}` down to `          {/* Card card-3 */}`.
search_str = r"""          {/\* Card card-mcqs \*/}.*?          {/\* Card card-3 \*/}"""
mcq_card_pattern = re.compile(search_str, re.DOTALL)

# Add the new Hero Card before the Grid Layout.
# We will insert it just above:
#         {/* Cards Grid */}
#         <motion.div
#           variants={containerVariants}

hero_card_code = """
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </motion.div>

        {/* Cards Grid */}
"""

content = re.sub(mcq_card_pattern, "          {/* Card card-3 */}", content)

grid_search = """        {/* Cards Grid */}
"""
content = content.replace(grid_search, hero_card_code)

with open("src/features/quiz/components/Dashboard.tsx", "w") as f:
    f.write(content)
