import React from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OwnerSVG, CEOSVG, BackendSVG, MarketingSVG } from './AboutSVGs';

export const DeveloperProfile: React.FC = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
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

    const roles = [
        {
            id: 'owner',
            title: 'Owner',
            name: 'Aalok Kumar Sharma',
            color: 'purple',
            SVG: OwnerSVG,
            image: './images/owner-profile.png'
        },
        {
            id: 'ceo',
            title: 'CEO',
            name: 'Manish Mishra',
            color: 'blue',
            SVG: CEOSVG,
            image: './images/ceo-profile.png'
        },
        {
            id: 'backend',
            title: 'Backend Manager',
            name: 'Ashu Mishra',
            color: 'cyan',
            SVG: BackendSVG,
            image: './images/backend-profile.png'
        },
        {
            id: 'marketing',
            title: 'Marketing Head',
            name: 'Dheeraj Kumar Sharma',
            color: 'rose',
            SVG: MarketingSVG,
            image: './images/marketing-profile.png'
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { border: string, glow: string, text: string }> = {
            purple: { border: 'border-b-purple-200/50 dark:border-b-purple-700/50 group-hover:border-purple-300 dark:group-hover:border-purple-500', glow: 'bg-purple-500', text: 'from-purple-600 to-purple-900 dark:from-purple-300 dark:to-purple-100' },
            blue: { border: 'border-b-blue-200/50 dark:border-b-blue-700/50 group-hover:border-blue-300 dark:group-hover:border-blue-500', glow: 'bg-blue-500', text: 'from-blue-600 to-blue-900 dark:from-blue-300 dark:to-blue-100' },
            cyan: { border: 'border-b-cyan-200/50 dark:border-b-cyan-700/50 group-hover:border-cyan-300 dark:group-hover:border-cyan-500', glow: 'bg-cyan-500', text: 'from-cyan-600 to-cyan-900 dark:from-cyan-300 dark:to-cyan-100' },
            rose: { border: 'border-b-rose-200/50 dark:border-b-rose-700/50 group-hover:border-rose-300 dark:group-hover:border-rose-500', glow: 'bg-rose-500', text: 'from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100' },
        };
        return colors[color];
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
                <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Developer Profile</h1>
            </div>

            <div className="flex-1 flex flex-col space-y-6 relative z-10 animate-fade-in w-full max-w-7xl mx-auto">
                <div className="relative text-left w-full">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-2 drop-shadow-sm">
                        Meet the Team
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                        The minds behind MindFlow.
                    </p>
                </div>

                {/* Cards Grid */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 w-full z-20">
                    {roles.map((role) => {
                        const style = getColorClasses(role.color);
                        return (
                            <motion.div
                                key={role.id}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative group cursor-pointer aspect-square sm:aspect-square min-h-[160px] rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                                onClick={() => navigate(`/about/developer-profile/${role.name.split(' ')[0].toLowerCase()}`)}
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className={`absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] ${style.border}`}></div>
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 ${style.glow}`}></div>

                                <div className="relative z-20 flex flex-col items-center justify-center h-full w-full p-4 sm:p-6 cursor-default">
                                    <div className="flex flex-col items-center justify-center h-full w-full space-y-3 sm:space-y-4">
                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/80 dark:border-white/20 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                                <img
                                                    src={role.image}
                                                    alt={role.name}
                                                    className="w-full h-full object-cover bg-gray-200 dark:bg-gray-700"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(role.name)}&background=random&color=fff&size=200`;
                                                    }}
                                                />
                                            </div>
                                            {/* Small icon badge overlay */}
                                            <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                                                <div className="w-full h-full scale-[1.2] opacity-90 drop-shadow-sm">
                                                    <role.SVG />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center w-full">
                                            <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1 sm:mb-1.5 line-clamp-1">{role.name}</p>
                                            <p className={`text-xs sm:text-sm font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r ${style.text} line-clamp-1`}>{role.title}</p>
                                        </div>
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
