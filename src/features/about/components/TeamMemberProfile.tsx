import React, { useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CEOSVG, BackendSVG, MarketingSVG } from './AboutSVGs';

const TEAM_MEMBERS = {
    manish: {
        name: 'Manish Mishra',
        role: 'CEO',
        description: 'Driving the business vision, operations, and external partnerships for MindFlow.',
        focus: 'Business Strategy',
        location: 'India',
        experience: '8+ Years',
        vision: 'Global Impact',
        SVG: CEOSVG,
        image: './images/ceo-profile.png',
        colors: {
            bg: 'bg-blue-50 dark:bg-gray-900',
            accent: 'blue',
            text: 'text-blue-600 dark:text-blue-400',
            bgLight: 'bg-blue-100 dark:bg-blue-900/30',
            border: 'border-blue-200 dark:border-blue-800'
        }
    },
    ashu: {
        name: 'Ashu Mishra',
        role: 'Backend Manager',
        description: 'Architecting scalable backend infrastructure and ensuring optimal performance and security.',
        focus: 'System Architecture',
        location: 'India',
        experience: '6+ Years',
        vision: 'Zero Downtime',
        SVG: BackendSVG,
        image: './images/backend-profile.png',
        colors: {
            bg: 'bg-cyan-50 dark:bg-gray-900',
            accent: 'cyan',
            text: 'text-cyan-600 dark:text-cyan-400',
            bgLight: 'bg-cyan-100 dark:bg-cyan-900/30',
            border: 'border-cyan-200 dark:border-cyan-800'
        }
    },
    dheeraj: {
        name: 'Dheeraj Kumar Sharma',
        role: 'Marketing Head',
        description: 'Crafting compelling narratives and leading growth strategies to expand MindFlow\'s reach.',
        focus: 'Growth & Branding',
        location: 'India',
        experience: '7+ Years',
        vision: 'Market Leader',
        SVG: MarketingSVG,
        image: './images/marketing-profile.png',
        colors: {
            bg: 'bg-rose-50 dark:bg-gray-900',
            accent: 'rose',
            text: 'text-rose-600 dark:text-rose-400',
            bgLight: 'bg-rose-100 dark:bg-rose-900/30',
            border: 'border-rose-200 dark:border-rose-800'
        }
    }
};

export const TeamMemberProfile: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const member = useMemo(() => {
        if (id && TEAM_MEMBERS[id as keyof typeof TEAM_MEMBERS]) {
            return TEAM_MEMBERS[id as keyof typeof TEAM_MEMBERS];
        }
        return null;
    }, [id]);

    if (!member) {
        return (
            <div className="flex flex-col min-h-screen -m-4 p-8 items-center justify-center bg-gray-50 dark:bg-gray-900">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Team Member Not Found</h1>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl">Go Back</button>
            </div>
        );
    }

    return (
        <div className={`flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden ${member.colors.bg}`}>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-8 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">{member.name.split(' ')[0]}'s Profile</h1>
            </div>

            <div className="flex-1 flex flex-col space-y-8 relative z-10 animate-fade-in w-full max-w-4xl mx-auto mt-8">
                {/* Profile Segment */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[40px] p-6 sm:p-10 shadow-2xl border border-white dark:border-gray-700/50 relative overflow-hidden"
                >
                     <div className={`absolute top-0 right-0 w-64 h-64 bg-${member.colors.accent}-500/20 rounded-bl-full blur-3xl pointer-events-none`}></div>
                     <div className={`absolute bottom-0 left-0 w-64 h-64 bg-${member.colors.accent}-500/10 rounded-tr-full blur-3xl pointer-events-none`}></div>

                     <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* Avatar */}
                        <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl shrink-0 relative group">
                            <img
                                src={member.image}
                                alt={member.name}
                                className="w-full h-full object-cover bg-gray-200 dark:bg-gray-700 group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=400`;
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                                <member.SVG />
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center md:text-left">
                            <div className={`inline-block px-3 py-1 ${member.colors.bgLight} ${member.colors.text} font-bold text-xs uppercase tracking-wider rounded-full mb-3 border ${member.colors.border}`}>
                                {member.role}
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                                {member.name}
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 font-medium leading-relaxed">
                                {member.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Focus</p>
                                    <p className="text-gray-900 dark:text-white font-bold">{member.focus}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Location</p>
                                    <p className="text-gray-900 dark:text-white font-bold">{member.location}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Experience</p>
                                    <p className="text-gray-900 dark:text-white font-bold">{member.experience}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Vision</p>
                                    <p className="text-gray-900 dark:text-white font-bold">{member.vision}</p>
                                </div>
                            </div>
                        </div>
                     </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TeamMemberProfile;
