import React from 'react';

/**
 * A static, simplified version of the DemoCard for mobile devices.
 *
 * Features:
 * - Optimized for smaller screens and touch interactions.
 * - Removes complex animations and cursor simulation to save battery/performance.
 * - Maintains the 3D visual style with CSS transforms.
 * - Provides better contrast for legibility on smaller displays.
 *
 * @returns {JSX.Element} The rendered MobileDemoCard.
 */
export const MobileDemoCard: React.FC = () => {
  return (
    <div 
      className="relative p-[1px] rounded-[2rem] bg-gradient-to-br from-white/80 via-white/20 to-transparent shadow-[0_20px_50px_-20px_rgba(67,56,202,0.25)] z-20 w-full aspect-[4/3] animate-float transform-gpu transition-all duration-500"
      style={{ 
        transform: 'rotateY(-8deg) rotateX(6deg)', 
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="relative w-full h-full bg-white dark:bg-gray-800/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 overflow-hidden flex flex-col border border-white/20 dark:border-slate-800/50">
        {/* Glossy Shine */}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-0" />
        
        {/* Static Header */}
        <div className="relative z-10 flex items-center justify-between mb-6 opacity-90">
          <div className="flex gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80 shadow-sm"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80 shadow-sm"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 shadow-sm"></div>
          </div>
          <div className="px-2 py-0.5 bg-indigo-100/50 rounded-md text-[10px] font-bold text-indigo-700 border border-indigo-200/30">
            PREVIEW
          </div>
        </div>

        {/* Static Question Content */}
        <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-2/3"></div>
              </div>
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4 leading-tight">
              Which CSS utility makes an element flex?
            </h4>
            
            <div className="space-y-2.5 flex-1">
              <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-600/10 flex items-center gap-3 shadow-sm">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-600 flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                </div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">display: flex</div>
              </div>

              {/* Increased opacity from white/40 to white/60 and text darkness for better contrast */}
              <div className="p-3 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white dark:bg-gray-800/60 dark:bg-slate-800/60 flex items-center gap-3 opacity-80">
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">display: block</div>
              </div>
            </div>

             <div className="mt-auto pt-2 flex justify-end">
                <div className="bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-lg">
                  Submit
                </div>
              </div>
        </div>
      </div>
    </div>
  );
};
