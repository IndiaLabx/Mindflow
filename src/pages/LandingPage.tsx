import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '@/features/auth';
import { PresenceAvatar } from '@/components/ui/PresenceAvatar';
import { getCanonicalAvatarUrl } from '@/utils/avatar';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ArrowRight, Brain, Zap, Layers, Star, Play, Github, Download, Target, User as UserIcon, LogOut, ChevronDown, Moon, Sun } from 'lucide-react';
import { ClaymorphismSwitch } from '@/features/quiz';
import { Button } from '@/components/Button/Button';
import { Typewriter } from '@/features/quiz';
import { DemoCard } from '@/features/quiz';
import { MobileDemoCard } from '@/features/quiz';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import InstallPwaModal from '@/components/common/InstallPwaModal';
import type { User } from '@supabase/supabase-js';
import founderImage from '@/assets/aalok.jpg';
import { CinematicIntro } from '@/features/quiz';
import { MobileOnboarding } from '@/features/quiz';
import { WelcomeIntro } from '@/features/quiz';

interface LandingPageProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
  onProfileClick: () => void;
  user: User | null;
  onSignOut: () => void;
}

/**
 * The main Landing Page component.
 *
 * Acts as the entry point for the application.
 * Features:
 * - Immersive 3D/animated background.
 * - Dynamic "Hero" section with kinetic typography.
 * - Interactive 3D Demo Card (Desktop) / Static Card (Mobile).
 * - PWA installation prompts.
 * - Navigation bar with Auth/Profile menu.
 *
 * @param {LandingPageProps} props - The component props.
 * @returns {JSX.Element} The rendered Landing Page.
 */
export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLoginClick, user, onProfileClick, onSignOut }) => {
  const { profile } = useAuth();
  const { canInstall, triggerInstall, installStatus } = usePWAInstall();
  const { isDarkMode, toggleDarkMode } = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFounderImageOpen, setIsFounderImageOpen] = useState(false);
  const [showMainContent, setShowMainContent] = useState(false);
  const [showMobileOnboarding, setShowMobileOnboarding] = useState(false);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(false);

  const handleReveal = React.useCallback(() => {
    setShowMainContent(true);
  }, []);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('mindflow_onboarding_seen');
    const isMobile = window.innerWidth < 768; // Standard md breakpoint in Tailwind
    if (isMobile && !hasSeenOnboarding) {
      setShowMobileOnboarding(true);
    }
  }, []);

  // Handlers
  const handleInstallClick = () => {
    setIsModalOpen(true);
  };

  const handleInstallConfirm = async () => {
    setIsModalOpen(false);
    const installed = await triggerInstall();
    if (installed) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };
  
  const handleSignOut = () => {
    onSignOut();
    setIsProfileMenuOpen(false);
  }

  const handleProfileClick = () => {
    onProfileClick();
    setIsProfileMenuOpen(false);
  }

  const shouldShowInstallButton = canInstall && installStatus !== 'success';

  const handleOnboardingComplete = () => {
    localStorage.setItem('mindflow_onboarding_seen', 'true');
    setShowMobileOnboarding(false);
    // Instead of immediately going to Dashboard, trigger the Welcome Intro
    setShowWelcomeIntro(true);
  };

  return (
    <>
      {/* Intro Animation Layer */}
      <CinematicIntro onReveal={handleReveal} />

      {/* Main Content Layer - mount/render when intro allows it */}
      {showMainContent && (
        <>

          {showWelcomeIntro && (
            <WelcomeIntro onComplete={() => {
              setShowWelcomeIntro(false);
              onGetStarted();
            }} />
          )}
          {showMobileOnboarding ? (
            <MobileOnboarding
              onComplete={handleOnboardingComplete}
              onInstallClick={handleInstallClick}
              shouldShowInstallButton={false}
            />
          ) : (
        <div className="relative min-h-screen flex flex-col items-center justify-start pb-0 overflow-x-hidden bg-slate-50 dark:bg-slate-800/50 selection:bg-indigo-100 selection:text-indigo-900 font-sans pt-[env(safe-area-inset-top)]">
      
      {/* --- 0. Noise Texture Overlay (Visual Polish) --- */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* --- Header / Navigation --- */}
      <nav className="relative w-full z-50 px-6 py-4 md:py-6 md:px-10 flex justify-between items-center animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 transition-colors">
            MindFlow
          </span>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-6">
           
           {/* PWA Install Button (Visible if installable) */}
           <a href="https://play.google.com/store/apps/details?id=com.aklabxmindflow.app" target="_blank" rel="noopener noreferrer" className="hidden md:block transition-transform hover:scale-105 active:scale-95">
              <img alt="Get it on Google Play" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" width="83" height="32" className="h-10 md:h-12 w-auto" />
           </a>

           <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <a href="#" className="hover:text-indigo-600 transition-colors">Features</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Methodology</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
           </div>
           <div className="h-5 w-px bg-slate-200 hidden md:block"></div>
           <div className="flex items-center gap-3">
              <a href="#" className="hidden sm:block p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-slate-100 transition-colors" aria-label="Github">
                 <Github className="w-5 h-5" />
              </a>
              

              <div className="mr-2 flex-shrink-0 flex items-center justify-center">
                <ClaymorphismSwitch checked={isDarkMode} onChange={toggleDarkMode} />
              </div>

              {user ? (
                <div className="relative">
                  <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 cursor-pointer">
                    <PresenceAvatar userId={user.id} avatarUrl={getCanonicalAvatarUrl(profile, user)} altText="User avatar" className="w-8 h-8" />
                    <ChevronDown className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                      <button onClick={handleProfileClick} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                        <UserIcon className="w-4 h-4" />
                        Profile
                      </button>
                      <button onClick={handleSignOut} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button variant="ghost" className="flex text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={onLoginClick}>
                  Log in
                </Button>
              )}
           </div>
        </div>
      </nav>

      {/* --- 1. The "Aurora" Atmosphere (Background) --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Grid Texture Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] mix-blend-multiply" />
        
        {/* MOBILE BACKGROUND: Lightweight Static Gradient with Hue Rotate Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white md:hidden animate-hue-slow" />

        {/* DESKTOP BACKGROUND: Heavy Animated Blobs (High Fidelity) */}
        <div className="hidden md:block">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/40 mix-blend-multiply filter blur-[120px] animate-blob" />
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-300/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-pink-200/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8 lg:gap-24 mt-8 md:mt-10 flex-1">
        
        {/* Left Side: Kinetic Typography & Actions */}
        <div className="flex-1 text-center md:text-left space-y-6 md:space-y-8">
          
          {/* Micro-Delight: Pulsing Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 text-xs font-bold uppercase tracking-wide shadow-[0_2px_10px_-3px_rgba(99,102,241,0.2)] backdrop-blur-md hover:bg-white dark:bg-gray-800 hover:shadow-indigo-200/50 transition-all duration-300 cursor-default group">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="group-hover:tracking-widest transition-all duration-300">v{import.meta.env.VITE_APP_VERSION} Live</span>
          </div>

          {/* Kinetic Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-[1.15] sm:leading-[1.1]">
            Ignite your <br />
            <span className="relative inline-block pb-2">
              {/* Gradient Mask Text */}
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 animate-gradient-x bg-[length:200%_200%]">
                Curiosity.
              </span>
              
              {/* Animated SVG Underline */}
              <svg className="absolute w-[105%] h-4 -bottom-1 -left-1 text-indigo-300 z-0" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.00025 7.00001C45.9181 3.36732 122.893 1.12598 196.001 4.00002" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ strokeDasharray: 200, strokeDashoffset: 200, animation: 'draw-line 6s ease-in-out infinite' }} />
              </svg>
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-xl mx-auto md:mx-0 leading-relaxed font-medium">
            MindFlow is an intelligent knowledge engine. We combine adaptive learning with 
            <span className="text-indigo-600 font-semibold"> beautiful design</span> to make mastering complex topics feel like play.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 justify-center md:justify-start pt-2 relative z-20">
            
            {/* --- DYNAMIC CTA BUTTON START --- */}
            <button 
              onClick={onGetStarted}
              aria-label="Start Exploring"
              className="relative group w-full sm:w-auto overflow-hidden rounded-full p-[3px] focus:outline-none focus:ring-4 focus:ring-indigo-400/50 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-indigo-200"
            >
              {/* 1. Animated Gradient Border/Glow Layer */}
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F1F5F9_0%,#F1F5F9_50%,#6366F1_75%,#EC4899_100%)]" />
              
              {/* 2. Main Button Content */}
              <span className="relative flex items-center justify-center gap-3 h-full w-full rounded-full bg-white dark:bg-gray-800 px-8 py-4 text-lg font-bold text-slate-900 dark:text-slate-100 backdrop-blur-3xl transition-all duration-300 group-hover:bg-slate-50 dark:bg-slate-800/50">
                <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-slate-400/20 to-transparent transform -skew-x-12 transition-all duration-700 group-hover:left-[100%] ease-in-out" />
                <span className="flex items-center">
                  Start&nbsp;<Typewriter />
                </span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 text-indigo-600" />
              </span>
            </button>

            {/* Mobile-Only Download App Button (Below Start) */}
            <a href="https://play.google.com/store/apps/details?id=com.aklabxmindflow.app" target="_blank" rel="noopener noreferrer" className="flex md:hidden w-full justify-center transition-transform hover:scale-105 active:scale-95 mt-2">
              <img alt="Get it on Google Play" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" width="83" height="32" className="h-12 w-auto" />
            </a>

            <button className="group hidden sm:flex items-center gap-3 px-6 py-4 text-slate-600 dark:text-slate-400 font-semibold transition-all w-full sm:w-auto justify-center rounded-full hover:bg-white dark:bg-gray-800 hover:text-indigo-700 border border-transparent hover:border-indigo-100 dark:border-indigo-900/30">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* --- Enhanced Social Proof --- */}
          <div className="hidden md:flex pt-6 md:pt-10 flex-col sm:flex-row items-center sm:items-start gap-6 animate-fade-in delay-150">
             <div className="flex -space-x-4">
                {[
                  "https://i.pravatar.cc/100?img=32",
                  "https://i.pravatar.cc/100?img=12",
                  "https://i.pravatar.cc/100?img=59",
                  "https://i.pravatar.cc/100?img=5"
                ].map((src, i) => (
                   <div key={i} className="relative w-12 h-12 rounded-full border-[3px] border-white dark:border-slate-800 shadow-sm overflow-hidden hover:scale-110 hover:z-10 transition-transform duration-200 cursor-pointer">
                      <img src={src} alt={`User ${i+1}`} className="w-full h-full object-cover" />
                   </div>
                ))}
                <div className="relative w-12 h-12 rounded-full border-[3px] border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                  2k+
                </div>
             </div>
             
             <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                   <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map(n => <Star key={n} className="w-4 h-4 fill-current" />)}
                   </div>
                   <span className="font-bold text-slate-700">4.9/5</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                   Loved by students at <span className="text-slate-800 dark:text-slate-200 font-bold">MIT</span>, <span className="text-slate-800 dark:text-slate-200 font-bold">Stanford</span> & <span className="text-slate-800 dark:text-slate-200 font-bold">Google</span>.
                </p>
             </div>
          </div>

        </div>

        {/* Right Side: Visuals */}
        <div className="flex-1 w-full max-w-[550px] relative mt-0 md:mt-0 perspective-1000">
          
          {/* MOBILE SPECIFIC CARD */}
          <div className="hidden md:hidden animate-fade-in">
             <MobileDemoCard />
          </div>

          {/* DESKTOP INTERACTIVE CARD */}
          <div className="hidden md:block relative animate-fade-in transform transition-transform hover:scale-[1.02] duration-500">
            <DemoCard />

            {/* Floating Artifacts (Desktop Only) */}
            <div 
              className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full blur-2xl opacity-60 animate-pulse -z-10"
              style={{ animationDuration: '4s' }}
            />
            
            <div className="absolute -bottom-6 -left-8 p-[1px] rounded-2xl bg-gradient-to-br from-white/80 via-white/20 to-transparent animate-float animation-delay-2000 z-30 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)]">
               <div className="bg-white dark:bg-gray-800 backdrop-blur-md p-4 pr-6 rounded-2xl flex items-center gap-4 h-full w-full">
                  <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Accuracy</div>
                    <div className="text-xl font-black text-slate-800 dark:text-slate-200">98.5%</div>
                  </div>
               </div>
            </div>

            <div className="absolute -top-12 left-8 bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-xl shadow-indigo-500/10 animate-bounce-slow z-30 transform -rotate-12">
                <Brain className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

        </div>
      </div>

      {/* --- Meet the Founder Section --- */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center animate-fade-in delay-300">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-8 text-center">Meet the Founder</h2>
        <div className="flex flex-col items-center group">
          <div
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 shadow-xl overflow-hidden cursor-pointer transform transition-transform duration-300 group-hover:scale-105 group-hover:border-indigo-300 group-hover:shadow-2xl"
            onClick={() => setIsFounderImageOpen(true)}
            role="button"
            aria-label="View Aalok Kumar Sharma full size"
          >
            <img
              src={founderImage}
              alt="Aalok Kumar Sharma, Founder"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">Aalok Kumar Sharma</h3>
            <p className="text-sm font-medium text-indigo-600 mt-1 uppercase tracking-wide">Founder</p>
          </div>
        </div>
      </div>

      {/* Footer Strip / Feature Ticker */}
      <div className="w-full border-t border-white/50 dark:border-slate-800/50 bg-white dark:bg-gray-800 backdrop-blur-lg py-6 mt-auto pb-[calc(1.5rem_+_env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center md:justify-between gap-8 text-slate-400 dark:text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest mb-4">
          <div className="flex items-center gap-2 hover:text-indigo-500 transition-colors cursor-default"><Zap className="w-4 h-4" /> Instant Evaluation</div>
          <div className="hidden md:block w-1 h-1 rounded-full bg-slate-300"></div>
          <div className="flex items-center gap-2 hover:text-indigo-500 transition-colors cursor-default"><Layers className="w-4 h-4" /> Adaptive Learning</div>
          <div className="hidden md:block w-1 h-1 rounded-full bg-slate-300"></div>
          <div className="flex items-center gap-2 hover:text-indigo-500 transition-colors cursor-default"><Star className="w-4 h-4" /> Expert Curated</div>
        </div>
        
        <div className="w-full text-center border-t border-slate-200 dark:border-slate-700/50 pt-4 pb-2">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} MindFlow Quiz App by Aalok Kumar Sharma. All Rights Reserved.
            </p>
        </div>
      </div>

      {/* Modals & Toasts */}
      {isModalOpen && (
        <InstallPwaModal 
          onConfirm={handleInstallConfirm}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg z-50 animate-fade-in-up">
          Installation started! Check your device's home screen for the MindFlow icon.
        </div>
      )}

      {/* Founder Image Modal */}
      {isFounderImageOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setIsFounderImageOpen(false)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsFounderImageOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-indigo-300 transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={founderImage}
              alt="Aalok Kumar Sharma, Founder"
              className="w-auto h-auto max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain border-4 border-white/10"
            />
          </div>
        </div>
      )}

      {/* --- CSS Keyframes & Accessibility --- */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        
        @keyframes hue-slow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .animate-hue-slow {
          animation: hue-slow 20s linear infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @keyframes float {
          0% { transform: rotateY(-10deg) rotateX(5deg) translateY(0px); }
          50% { transform: rotateY(-10deg) rotateX(5deg) translateY(-20px); }
          100% { transform: rotateY(-10deg) rotateX(5deg) translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes bounce-slow {
           0%, 100% { transform: rotate(-12deg) translateY(0); }
           50% { transform: rotate(-12deg) translateY(-15px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 8s ease infinite;
        }

        @keyframes draw-line {
          0% { stroke-dashoffset: 200; opacity: 0; }
          5% { opacity: 1; }
          20% { stroke-dashoffset: 0; }
          80% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }

        /* Reduce Motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-blob, 
          .animate-float, 
          .animate-bounce-slow, 
          .animate-gradient-x, 
          .animate-spin,
          .animate-pulse, 
          .animate-hue-slow {
            animation: none !important;
            transform: none !important;
          }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) translateX(-50%); }
          to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
      </div>
          )}
        </>
      )}
    </>
  );
};
