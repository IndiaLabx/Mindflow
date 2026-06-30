import React, { useContext, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { HydrationDebugger } from '../components/debug/HydrationDebugger';
import { useDebugStore } from '../stores/useDebugStore';
import { PresenceAvatar } from '../components/ui/PresenceAvatar';
import { getCanonicalAvatarUrl } from '../utils/avatar';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Home, LayoutDashboard, GraduationCap, PlusCircle, User, Settings, LogIn, Sun, Moon, Brain, Menu, Search, Play, MessageSquare, ArrowLeft, Users } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../features/auth/context/AuthContext';
import { useQuizContext } from '../features/quiz/context/QuizContext';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useLayoutStore } from '../stores/useLayoutStore';
import { useSocialStore } from '@/features/community';
import { ClaymorphismSwitch } from '../features/quiz/components/ui/ClaymorphismSwitch';
import { NotificationBell } from '../features/notifications/components/NotificationBell';
import { SidePanel } from './SidePanel';


/**
 * Unique identifiers for the main navigation tabs.
 */
export type TabID = 'home' | 'school' | 'create' | 'profile' | 'login' | 'ai' | 'community' | 'messages' | 'search' | 'reels';

/**
 * Props for the MainLayout component.
 */
interface MainLayoutProps {
  /** The main content to render within the layout frame. */
  children: React.ReactNode;
  /** The currently active navigation tab. */
  activeTab: any;
  /** Callback to switch tabs. */
  onTabChange: (tab: TabID) => void;
  /** Callback to open the settings modal. */
  onOpenSettings: () => void;
}

/**
 * The primary application layout shell.
 *
 * Provides:
 * - Sticky Top Header (Logo + Avatar/Settings).
 * - Scrollable Main Content Area.
 * - Sticky Bottom Navigation Bar (Tabs).
 * - Responsive constraints (centered content max-width).
 *
 * @param {MainLayoutProps} props - The layout configuration.
 * @returns {JSX.Element} The rendered layout.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange,
  onOpenSettings 
}) => {
  const { user, profile } = useAuth();
  useEffect(() => {
    useDebugStore.getState().logEvent('MainLayout rendered', { profileExists: !!profile, metadataUrl: user?.user_metadata?.avatar_url });
  }, [user, profile]);
  const { isReviewMode } = useQuizContext();
  const { isDarkMode, toggleDarkMode } = useSettingsStore();
  const { isSocialMode, toggleSocialMode } = useSocialStore();
  const { hideGlobalFooter } = useLayoutStore();
  const location = useLocation();
  const isAIFullScreen = location.pathname.startsWith('/ai/chat') || location.pathname.startsWith('/ai/talk') || location.pathname.startsWith('/tools/text-exporter') || location.pathname.startsWith('/tools/flashcard-maker');
  const isReelsFullScreen = location.pathname.startsWith('/community/reels');
  const isMessagingFullScreen = location.pathname.startsWith('/messages');

  // Auto toggle based on pathname if user lands directly on a social route
  useEffect(() => {
    if (location.pathname.startsWith('/community') || location.pathname.startsWith('/messages')) {
      if (!isSocialMode) toggleSocialMode(true);
    } else if (isSocialMode && !location.pathname.startsWith('/community') && !location.pathname.startsWith('/messages')) {
      toggleSocialMode(false);
    }
  }, [location.pathname]);

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Golden Ring Animation Setup
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, height: 48, top: 8, borderRadius: 16, opacity: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLButtonElement>(null);
  const schoolRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLButtonElement>(null);
  const aiRef = useRef<HTMLButtonElement>(null);
  const communityRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLButtonElement>(null);
  const reelsRef = useRef<HTMLButtonElement>(null);
  const messagesRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      let activeRef = null;
      let isAi = false;
      if (activeTab === 'home') activeRef = homeRef;
      else if (activeTab === 'school') activeRef = schoolRef;
      else if (activeTab === 'profile' || activeTab === 'login') activeRef = profileRef;
      else if (activeTab === 'community') activeRef = communityRef;
      else if (activeTab === 'search') activeRef = searchRef;
      else if (activeTab === 'reels') activeRef = reelsRef;
      else if (activeTab === 'messages') activeRef = messagesRef;
      else if (activeTab === 'ai') {
        activeRef = aiRef;
        isAi = true;
      }

      if (activeRef && activeRef.current && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const tabRect = activeRef.current.getBoundingClientRect();

        // Calculate offset relative to the nav container
        // offsetLeft avoids issues when scroll is present or viewport resize happens unexpectedly
        const baseLeft = tabRect.left - navRect.left;
        const baseWidth = tabRect.width;

        if (isAi) {
          // AI Button logic: Wrap the elevated circular button
          const height = tabRect.height + 12; // Extra padding
          const widthForAi = tabRect.width + 12;
          const leftForAi = baseLeft - 6; // Center the larger outline over the button
          const top = tabRect.top - navRect.top - 6;

          setIndicatorStyle({
            left: leftForAi,
            width: widthForAi,
            height: height,
            top: top,
            borderRadius: height / 2,
            opacity: 1
          });
        } else {
          // Standard tab logic
          const height = 56; // Increased from 48 to wrap text completely
          // Vertically center in the 56px (h-14) nav container
          const top = (56 - height) / 2;
          const left = baseLeft - 4;
          const width = baseWidth + 8;

          setIndicatorStyle({
            left,
            width,
            height,
            top,
            borderRadius: 16, // rounded-2xl
            opacity: 1
          });
        }
      } else {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      }
    };

    // Delay initial measurement to ensure DOM nodes are fully painted
    // Especially important when isSocialMode toggles and conditionally renders new tabs
    const timeoutId = setTimeout(updateIndicator, 50);

    window.addEventListener('resize', updateIndicator);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(timeoutId);
    };
  }, [activeTab, isSocialMode]);


  const handleProfileClick = () => {
    if (user) {
      onTabChange('profile');
    } else {
      onTabChange('login');
    }
  };

  useEffect(() => {
    if (!document.getElementById('mesh-keyframes')) {
        const style = document.createElement('style');
        style.id = 'mesh-keyframes';
        style.innerHTML = `
            @keyframes flow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .animate-flow {
                background-size: 200% 200%;
                animation: flow 15s ease infinite;
            }
        `;
        document.head.appendChild(style);
    }
  }, []);

  return (
    <div className={cn(
        "flex flex-col transition-colors duration-700 relative bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 animate-flow",
        isAIFullScreen || isMessagingFullScreen ? "h-[100dvh] w-screen overflow-hidden fixed inset-0" : isReelsFullScreen ? "h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))] w-screen overflow-hidden fixed top-0 left-0" : "min-h-screen"
    )}>
      
      {/* --- Sticky Top Header --- */}
      {!isReviewMode && !isAIFullScreen && !isReelsFullScreen && !isSocialMode && (
      <header className="sticky top-0 z-40 w-full transition-all duration-300 relative group overflow-visible">
        {/* Glow Background Layer */}
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

        {/* Interactive Inner Shadow / Border */}
        <div className="absolute inset-0 border-b border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 border-b-[4px] border-b-indigo-200/50 dark:border-b-indigo-700/50"></div>

        {/* Centered Subtle Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-20 transition-opacity duration-500 z-0 bg-indigo-500"></div>

        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between relative z-20">

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('home')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white transition-colors duration-300 leading-none">MindFlow</span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">v{import.meta.env.VITE_APP_VERSION}</span>
            </div>
          </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="mr-2 flex-shrink-0 flex items-center justify-center">
              <ClaymorphismSwitch checked={isDarkMode} onChange={toggleDarkMode} />
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button onClick={() => onTabChange('profile')} className="rounded-full transition-opacity duration-200 hover:opacity-80">
                  <PresenceAvatar
                    userId={user.id}
                    avatarUrl={getCanonicalAvatarUrl(profile, user)}
                    altText="User Avatar"
                    className="w-8 h-8"
                  />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenSettings}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
               aria-label="Open Settings">
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setIsSidePanelOpen(true)} aria-label="Open Menu" className="p-2 -mr-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>
      )}

      <SidePanel isOpen={isSidePanelOpen} onClose={() => setIsSidePanelOpen(false)} onTabChange={(tab: string) => onTabChange(tab as any)} />

      {/* --- Main Scrollable Content --- */}
      <main className={cn(
        "flex-1 w-full relative z-0",
        (isAIFullScreen || isReelsFullScreen)
            ? "max-w-none p-0 overflow-hidden h-full"
            : cn("max-w-3xl mx-auto px-4 pt-4", isReviewMode ? "pb-4" : "pb-24")
      )}>
        {children}
      </main>
      <HydrationDebugger />

      {/* --- Sticky Bottom Tab Bar --- */}

      <nav className={cn(
        "main-layout-nav",
        "fixed bottom-0 left-0 w-full z-[10000] transition-colors duration-300 pb-[env(safe-area-inset-bottom)] pt-2 group overflow-visible",
        isReviewMode || isAIFullScreen || isMessagingFullScreen || hideGlobalFooter ? 'hidden' : 'block'
      )}>
        {/* Glow Background Layer */}
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

        {/* Interactive Inner Shadow / Border */}
        <div className="absolute inset-0 border-t border-white/60 dark:border-white/10 shadow-[0_-8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_-8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 border-t-[4px] border-t-indigo-200/50 dark:border-t-indigo-700/50"></div>

        {/* Centered Subtle Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-20 transition-opacity duration-500 z-0 bg-indigo-500"></div>
        <div ref={navRef} role="tablist" className="max-w-3xl mx-auto px-2 h-14 flex items-center justify-around relative z-20">
          
                    {/* Golden Ring Active Indicator */}
          <motion.div
            className="absolute left-0 top-0 pointer-events-none z-0"
            animate={{
              x: indicatorStyle.left,
              y: indicatorStyle.top,
              width: indicatorStyle.width,
              height: indicatorStyle.height,
              borderRadius: indicatorStyle.borderRadius,
              opacity: indicatorStyle.opacity,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              willChange: 'transform, width, height, border-radius, opacity',
              transform: 'translateZ(0)'
            }}
          >
            {/* Glow Layer */}
            <div className="absolute inset-0 bg-[var(--gold-glow)] blur-xl" style={{ borderRadius: 'inherit' }}></div>

            {/* Inner Plate & Clip Mask Container */}
            <div className="absolute inset-0 overflow-hidden p-[2px]" style={{ borderRadius: 'inherit' }}>
              {/* Rotating Conic Gradient */}
              <div className="absolute inset-[-100%] indicator-gradient" style={{
                background: 'conic-gradient(from 0deg, transparent 0%, var(--gold-2) 20%, var(--gold-3) 50%, var(--gold-2) 80%, transparent 100%)'
              }}></div>

              {/* Inner Plate Layer */}
              <div className="absolute inset-[2px] bg-white dark:bg-slate-900 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]" style={{ borderRadius: 'inherit' }}></div>
            </div>
          </motion.div>

          {/* If we are in the community section, render Social Tabs instead */}
          {isSocialMode ? (
            <>
              <NavTab 
                id="community" 
                label="Feed" hideTextOnMobile
                icon={<LayoutDashboard className="w-6 h-6" />}
                isActive={(activeTab as any) === 'community'} 
                onClick={() => onTabChange('community')}
                buttonRef={communityRef}
              />
              
              <NavTab 
                id="search"
                label="Search" hideTextOnMobile
                icon={<Search className="w-6 h-6" />}
                isActive={(activeTab as any) === 'search'}
                onClick={() => onTabChange('search')}
                buttonRef={searchRef}
              />
              
              <NavTab
                id="reels"
                label="Reels" hideTextOnMobile
                icon={<Play className="w-6 h-6" />}
                isActive={(activeTab as any) === 'reels'}
                onClick={() => onTabChange('reels')}
                buttonRef={reelsRef}
              />

              <NavTab
                id="messages"
                label="Messages" hideTextOnMobile
                icon={<MessageSquare className="w-6 h-6" />}
                isActive={(activeTab as any) === 'messages'}
                onClick={() => onTabChange('messages')}
                buttonRef={messagesRef}
              />

              <NavTab
                id="home"
                label="Learn" hideTextOnMobile
                icon={<ArrowLeft className="w-6 h-6" />}
                isActive={false}
                onClick={() => onTabChange('home')}
                buttonRef={homeRef}
              />
            </>
          ) : (
            <>
              <NavTab 
                id="home" 
                label="Dashboard"
                icon={<LayoutDashboard className="w-6 h-6" />}
                isActive={activeTab === 'home'} 
                onClick={() => onTabChange('home')}
                buttonRef={homeRef}
              />
              
              <NavTab 
                id="school"
                label="School"
                icon={<GraduationCap className="w-6 h-6" />}
                isActive={activeTab === 'school'}
                onClick={() => onTabChange('school')}
                buttonRef={schoolRef}
              />
              
              <button 
                ref={aiRef}
                onClick={() => onTabChange('ai')}
                role="tab" aria-label="AI Assistant" className="relative -top-5 group z-30"
              >
                <div className={cn(
                  "relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4 border-white dark:border-slate-900",
                  activeTab === 'ai'
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/50 translate-y-1"
                    : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600 hover:scale-105 shadow-indigo-600/30"
                )}>
                  <div className="absolute inset-0 rounded-full border border-white/20"></div>
                  {activeTab === 'ai' && (
                    <div className="absolute inset-0 rounded-full blur-md bg-indigo-500/30 -z-10"></div>
                  )}
                  <Brain className="w-7 h-7" />
                </div>
                <span className={cn(
                  "absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-colors hidden md:block",
                  activeTab === 'ai' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500"
                )}>
                  AI
                </span>
              </button>

              <NavTab
                id="community"
                label="Social"
                icon={<Users className="w-6 h-6" />}
                isActive={(activeTab as any) === 'community'}
                onClick={() => onTabChange('community')}
                buttonRef={communityRef}
              />

              {user ? (
                <NavTab
                  id="profile"
                  label="Profile"
                  icon={<User className="w-6 h-6" />}
                  isActive={activeTab === 'profile'}
                  onClick={handleProfileClick}
                  buttonRef={profileRef}
                />
              ) : (
                <NavTab
                  id="login"
                  label="Sign In"
                  icon={<LogIn className="w-6 h-6" />}
                  isActive={activeTab === 'login'}
                  onClick={handleProfileClick}
                  buttonRef={profileRef}
                />
              )}
            </>
          )}
        </div>
</nav>
    </div>
  );
};

// Helper Subcomponent for Tab Items
const NavTab = ({ id, label, icon, isActive, onClick, buttonRef, hideTextOnMobile }: { id: string, label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void, buttonRef?: React.RefObject<HTMLButtonElement | null>, hideTextOnMobile?: boolean }) => (
  <motion.button
    ref={buttonRef}
    onClick={onClick}
    whileHover={{ scale: 1.10 }}
    whileTap={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    role="tab"
    aria-selected={isActive}
    className={cn(
      "relative flex flex-col items-center justify-center min-w-[4.5rem] px-2 py-1 w-auto transition-all group outline-none",
      "style-[transition:all_0.4s_var(--easing-bounce)]",
      isActive ? "" : "text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-slate-300"
    )}
  >
    <div className={cn(
      "relative z-10 p-1.5 rounded-xl transition-all duration-400",
      isActive
         ? ""
         : "bg-transparent group-hover:bg-gray-100/50 dark:group-hover:bg-gray-800/50"
    )}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
         className: cn(
           (icon as React.ReactElement<{ className?: string }>).props.className,
           "transition-all duration-400",
           isActive ? "text-[var(--gold-2)] dark:text-[var(--gold-3)] scale-110" : ""
         )
      }) : icon}
    </div>
    <span className={cn(
      "text-[10px] font-bold mt-1 transition-all z-10",
      hideTextOnMobile ? "hidden md:block" : "",
      isActive
         ? "text-[var(--gold-2)] dark:text-[var(--gold-3)] font-black tracking-wide"
         : "font-semibold"
    )}>{label}</span>
  </motion.button>
);
