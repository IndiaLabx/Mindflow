import React, { useEffect } from 'react';
import { useDebugStore } from '../stores/useDebugStore';
import { PresenceAvatar } from '../components/ui/PresenceAvatar';
import { getCanonicalAvatarUrl } from '../utils/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, LogIn, Home, LayoutDashboard, Languages,
    Wrench, Download, Info, GraduationCap, FileText, Shield, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    onTabChange: (tab: string) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, onTabChange }) => {
    const { user, profile, signOut } = useAuth();
  useEffect(() => {
    if (isOpen) useDebugStore.getState().logEvent('SidePanel rendered', { profileExists: !!profile });
  }, [isOpen, user, profile]);
    const navigate = useNavigate();

    const handleNavigation = (path: string, tab?: string) => {
        onClose();
        if (path === 'DOWNLOAD_LINK') {
                window.open('https://drive.google.com/drive/folders/1Owy8_qnvMOTw5WLRGLQajCiScN-dOHtF', '_blank');
            } else if (path === 'HOME_LINK') {
                window.open('https://aklabx.github.io/MindFlow', '_self');
            } else {
                if (tab) onTabChange(tab);
                navigate(path);
            }

    };

    // --- Animation Variants ---

    // 1. Overlay (Fade in with backdrop blur)
    const overlayVariants = {
        hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
        visible: {
            opacity: 1,
            backdropFilter: 'blur(8px)',
            transition: { duration: 0.15 }
        },
        exit: {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            transition: { duration: 0.15 }
        }
    };

    // 2. Panel Base (Slide in from right)
    const panelVariants = {
        hidden: { x: '100%' },
        visible: { x: 0, transition: { ease: 'easeOut' as const, duration: 0.15 } },
        exit: { x: '100%', transition: { ease: 'easeIn' as const, duration: 0.15 } }
    };




    const menuItems = [
        { icon: Home, label: 'Home', path: 'HOME_LINK', colorClasses: 'text-indigo-600 dark:text-indigo-400', bgClasses: 'bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40' },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', tab: 'home', colorClasses: 'text-fuchsia-600 dark:text-fuchsia-400', bgClasses: 'bg-fuchsia-50 dark:bg-fuchsia-900/20 group-hover:bg-fuchsia-100 dark:group-hover:bg-fuchsia-900/40' },
        { icon: Languages, label: 'English Zone', path: '/english', tab: 'home', colorClasses: 'text-rose-600 dark:text-rose-400', bgClasses: 'bg-rose-50 dark:bg-rose-900/20 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40' },
        { icon: Wrench, label: 'Tools', path: '/tools', tab: 'home', colorClasses: 'text-amber-600 dark:text-amber-400', bgClasses: 'bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40' },
        { icon: Download, label: 'Download', path: 'DOWNLOAD_LINK', colorClasses: 'text-cyan-600 dark:text-cyan-400', bgClasses: 'bg-cyan-50 dark:bg-cyan-900/20 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/40' },
        { icon: Info, label: 'About Us', path: '/about', tab: 'home', colorClasses: 'text-slate-600 dark:text-slate-400', bgClasses: 'bg-slate-50 dark:bg-slate-900/20 group-hover:bg-slate-100 dark:group-hover:bg-slate-900/40' },
        { icon: GraduationCap, label: 'School Mode', path: '/school', tab: 'school', colorClasses: 'text-teal-600 dark:text-teal-400', bgClasses: 'bg-teal-50 dark:bg-teal-900/20 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/40' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="fixed inset-0 z-[10010] bg-slate-900/40 dark:bg-slate-900/60"
                        aria-hidden="true"
                    />

                    {/* Side Panel Container */}
                    <motion.div
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed top-0 right-0 h-[100dvh] w-4/5 max-w-sm z-[10020] bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden border-l border-white/20 dark:border-white/10"
                    >
                        {/* Inner Glassmorphism Layer */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white/80 dark:from-slate-800/50 dark:to-slate-900/80 backdrop-blur-3xl -z-10" />

                        <div className="flex flex-col h-full w-full relative">
                            {/* --- Top: Header & Profile --- */}
                            <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 relative">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="mt-8">
                                    {user ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 p-1 shadow-inner border border-white dark:border-slate-700">
                                                <PresenceAvatar
                                                    userId={user.id}
                                                    avatarUrl={getCanonicalAvatarUrl(profile, user)}
                                                    altText="User Avatar"
                                                    className="w-full h-full"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                                    {user.user_metadata?.full_name || 'MindFlow User'}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {user.email}
                                                </p>
                                                <button
                                                    onClick={() => handleNavigation('/profile', 'profile')}
                                                    className="mt-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start gap-3">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 flex items-center justify-center border border-white dark:border-slate-700">
                                                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Guest User</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Sign in to sync your progress</p>
                                                <button
                                                    onClick={() => handleNavigation('/login', 'login')}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                                                >
                                                    <LogIn className="w-4 h-4" />
                                                    Sign In / Up
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- Top/Mid: Google Play Badge --- */}
                            <div className="px-6 pb-4 w-full flex justify-center border-b border-gray-100 dark:border-gray-800/50 mb-2">
                                <a href="https://play.google.com/store/apps/details?id=com.aklabxmindflow.app" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105 active:scale-95">
                                    <img alt="Get it on Google Play" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" width="83" height="32" className="h-12 w-auto drop-shadow-sm" />
                                </a>
                            </div>

                            {/* --- Middle: Navigation Links (Staggered) --- */}
                            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-3 custom-scrollbar">
                                {menuItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleNavigation(item.path, item.tab)}
                                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group border border-gray-900 dark:border-white shadow-sm"
                                    >
                                        <div className={`p-2 rounded-xl transition-all ${item.bgClasses}`}>
                                            <item.icon className={`w-5 h-5 transition-colors ${item.colorClasses}`} />
                                        </div>
                                        <span className={`font-bold transition-colors ${item.colorClasses}`}>
                                            {item.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                                                        {/* --- User Actions: Sign Out (Only for logged in users) --- */}
                            {user && (
                                <div className="px-6 py-2 border-t border-gray-100 dark:border-gray-800 mt-auto">
                                    <button
                                        onClick={async () => {
                                            await signOut();
                                            onClose();
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors font-semibold group"
                                    >
                                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            )}

                            {/* --- Bottom: Branding & Legal --- */}
                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/20">

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-indigo-600 p-1.5 rounded-xl shadow-inner border border-indigo-500">
                                        <img src="./mindflow-icon.svg" alt="MindFlow Logo" className="w-6 h-6" onError={(e) => {
                                            // Fallback to text icon if SVG fails to load
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4 4.5 4.5 0 0 1-3-4"/></svg>';
                                        }} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 dark:text-white tracking-tight">MindFlow</h4>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">© {new Date().getFullYear()} All rights reserved</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-semibold">
                                    <button
                                        onClick={() => handleNavigation('/privacy-policy')}
                                        className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        Privacy Policy
                                    </button>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <button
                                        onClick={() => handleNavigation('/about/terms-of-use')}
                                        className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        Terms of Use
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
