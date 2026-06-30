import React, { useState, useContext, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MainLayout, TabID } from '../../layouts/MainLayout';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { Fireballs } from '../../components/Background/Fireballs';
import { SettingsModal } from './components/ui/SettingsModal';
import { useAuth } from '../auth/context/AuthContext';
import { useQuizContext } from './context/QuizContext';
import { SynapticLoader } from '../../components/ui/SynapticLoader';

export const QuizLayout: React.FC = () => {
    const areBgAnimationsEnabled = useSettingsStore(state => state.areBgAnimationsEnabled);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { enterHome, enterEnglishHome, enterConfig, enterProfile, enterLogin } = useQuizContext();

    // Determine active tab based on URL
    const getActiveTab = (): TabID => {
        const path = location.pathname;
        if (path.includes('/login')) return 'login';
        if (path.includes('/community/search')) return 'search';
        if (path.includes('/community/reels')) return 'reels';
        if (path.includes('/community')) return 'community';
        if (path.includes('/messages')) return 'messages';
        if (path.includes('/ai')) return 'ai';
        if (path.includes('/profile') || path.includes('/settings')) return 'profile';
        if (path.includes('/school')) return 'school';
        if (path.includes('/quiz/config')) return 'create';
        return 'home';
    };

    const handleTabChange = (tab: TabID) => {
        switch (tab) {
            case 'home':
                enterHome();
                navigate('/dashboard');
                break;
            case 'community':
                navigate('/community');
                break;
            case 'messages':
                navigate('/messages');
                break;
            case 'search':
                navigate('/community/search');
                break;
            case 'reels':
                navigate('/community/reels');
                break;
            case 'school':
                navigate('/school');
                break;
            case 'create':
                enterConfig();
                navigate('/quiz/config');
                break;
            case 'profile':
                if (user) {
                    enterProfile();
                    navigate('/profile');
                } else {
                    enterLogin();
                    navigate('/login');
                }
                break;
            case 'ai':
                navigate('/ai');
                break;
            case 'login':
                enterLogin();
                navigate('/login');
                break;
        }
    };

    return (
        <MainLayout
            activeTab={getActiveTab()}
            onTabChange={handleTabChange}
            onOpenSettings={() => setIsSettingsOpen(true)}
        >
            <Suspense fallback={<div className="flex justify-center py-12"><SynapticLoader size="lg" /></div>}>
                {areBgAnimationsEnabled && <Fireballs />}
                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                <Outlet />
            </Suspense>
        </MainLayout>
    );
};
