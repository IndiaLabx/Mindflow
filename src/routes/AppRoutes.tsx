import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QuizProvider, useQuizContext } from '@/features/quiz';
import { useFlashcardStore } from '@/features/quiz';
import { QuizLayout } from '@/features/quiz';
import { useAuth } from '@/features/auth';
import { SynapticLoader } from '../components/ui/SynapticLoader';
import { ProtectedRoute } from '../providers/ProtectedRoute';
import { ErrorBoundary } from '../providers/ErrorBoundary';
import { useHardwareBackButton } from '../hooks/useHardwareBackButton';
import { useNotificationStore } from '../stores/useNotificationStore';

// Lazy Loaded Components for Code Splitting
// Groups: Main UI, Quiz Flow, Flashcard Flow, Auth Flow
const CommunityFeed = lazy(() => import('../features/community/pages/CommunityFeed').then(m => ({ default: m.CommunityFeed })));
const ChatRooms = lazy(() => import('../features/community/pages/ChatRooms').then(m => ({ default: m.ChatRooms })));
const ReelsFeed = lazy(() => import('../features/community/pages/ReelsFeed').then(m => ({ default: m.ReelsFeed })));
const ReelCommentsPage = lazy(() => import('../features/community/pages/ReelCommentsPage').then(m => ({ default: m.ReelCommentsPage })));
const CommunitySearch = lazy(() => import('../features/community/pages/CommunitySearch').then(m => ({ default: m.CommunitySearch })));
const UserProfile = lazy(() => import('../features/community/pages/UserProfile').then(m => ({ default: m.UserProfile })));
const PostPage = lazy(() => import('../features/community/pages/PostPage').then(m => ({ default: m.PostPage })));



const SchoolHomePage = lazy(() => import('../pages/SchoolHomePage').then(m => ({ default: m.SchoolHomePage })));
const SchoolDownloads = lazy(() => import('../features/school/SchoolDownloads').then(m => ({ default: m.SchoolDownloads })));
const LandingPage = lazy(() => import('../pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Dashboard = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const McqsQuizHome = lazy(() => import('../pages/McqsQuizHomePage').then(m => ({ default: m.McqsQuizHomePage })));
const EnglishQuizHome = lazy(() => import('../pages/EnglishQuizHomePage').then(m => ({ default: m.EnglishQuizHomePage })));
const QuizConfig = lazy(() => import('../features/quiz/components/QuizConfig').then(m => ({ default: m.QuizConfig })));
const QuizLibrary = lazy(() => import('../features/quiz/components/QuizLibrary').then(m => ({ default: m.QuizLibrary })));

const PerformanceAnalytics = lazy(() => import('../features/quiz/components/PerformanceAnalytics').then(m => ({ default: m.PerformanceAnalytics })));
const BookmarksPage = lazy(() => import('../pages/BookmarksPage').then(m => ({ default: m.BookmarksPage })));
const IdiomsConfig = lazy(() => import('../features/vocab/idioms/IdiomsConfig').then(m => ({ default: m.IdiomsConfig })));
const OWSConfig = lazy(() => import('../features/vocab/ows/OWSConfig').then(m => ({ default: m.OWSConfig })));
const LiveQuizRoom = lazy(() => import('../features/quiz/live/LiveQuizRoom').then(m => ({ default: m.LiveQuizRoom })));
const SynonymsConfig = lazy(() => import('../features/vocab/synonyms/SynonymsConfig').then(m => ({ default: m.SynonymsConfig })));
const SynonymsHub = lazy(() => import('../features/vocab/synonyms/SynonymsHub').then(m => ({ default: m.SynonymsHub })));
const OWSHub = lazy(() => import('../features/vocab/ows/OWSHub').then(m => ({ default: m.OWSHub })));
const IdiomsHub = lazy(() => import('../features/vocab/idioms/IdiomsHub').then(m => ({ default: m.IdiomsHub })));
const SynonymClusterList = lazy(() => import('../features/vocab/synonyms/components/SynonymClusterList').then(m => ({ default: m.SynonymClusterList })));

const BlueprintPreviewWrapper = lazy(() => import('../features/blueprints/components/BlueprintPreviewWrapper').then(m => ({ default: m.BlueprintPreviewWrapper })));
const ExamBlueprintsHub = lazy(() => import('../pages/ExamBlueprintsHubPage').then(m => ({ default: m.ExamBlueprintsHubPage })));

const AdminReportsQueue = lazy(() => import('../features/admin/components/AdminReportsQueue').then(m => ({ default: m.AdminReportsQueue })));
const AdminHomePage = lazy(() => import('../pages/AdminHomePage').then(m => ({ default: m.AdminHomePage })));
const AdminManageMaterials = lazy(() => import('../features/admin/components/AdminManageMaterials').then(m => ({ default: m.AdminManageMaterials })));
const AdminUploadGK = lazy(() => import("../features/admin/components/AdminUploadGK").then(m => ({ default: m.AdminUploadGK })));
const AdminUploadOWS = lazy(() => import("../features/admin/components/AdminUploadOWS").then(m => ({ default: m.AdminUploadOWS })));
const AdminUploadIdioms = lazy(() => import("../features/admin/components/AdminUploadIdioms").then(m => ({ default: m.AdminUploadIdioms })));
const AdminUploadSynonyms = lazy(() => import("../features/admin/components/AdminUploadSynonyms").then(m => ({ default: m.AdminUploadSynonyms })));
const AdminUploadMaterials = lazy(() => import('../features/admin/components/AdminUploadMaterials').then(m => ({ default: m.AdminUploadMaterials })));
const AdminNotifications = lazy(() => import('../features/notifications/admin/AdminNotifications').then(m => ({ default: m.AdminNotifications })));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

const SynonymQuizSession = lazy(() => import('../features/vocab/synonyms/components/SynonymQuizSession').then(m => ({ default: m.SynonymQuizSession })));
const SynonymPhase1Session = lazy(() => import('../features/vocab/synonyms/components/SynonymPhase1Session').then(m => ({ default: m.SynonymPhase1Session })));

const QuizResult = lazy(() => import('../features/quiz/components/QuizResult').then(m => ({ default: m.QuizResult })));
const MockQuizResult = lazy(() => import('../features/quiz/components/MockQuizResult').then(m => ({ default: m.MockQuizResult })));
const SynonymFlashcardSession = lazy(() => import("../features/vocab/synonyms/components/SynonymFlashcardSession").then(m => ({ default: m.SynonymFlashcardSession })));
const GodQuizResult = lazy(() => import('../features/quiz/components/GodQuizResult').then(m => ({ default: m.GodQuizResult })));
const FlashcardSummary = lazy(() => import('../features/flashcards/components/FlashcardSummary').then(m => ({ default: m.FlashcardSummary })));
const AboutUs = lazy(() => import('../features/about/components/AboutUs').then(m => ({ default: m.AboutUs })));
const DeveloperProfile = lazy(() => import('../features/about/components/DeveloperProfile').then(m => ({ default: m.DeveloperProfile })));
const AalokProfile = lazy(() => import('../features/about/components/AalokProfile').then(m => ({ default: m.AalokProfile })));
const TeamMemberProfile = lazy(() => import('../features/about/components/TeamMemberProfile').then(m => ({ default: m.TeamMemberProfile })));

const TermsOfUse = lazy(() => import('../pages/TermsOfUse').then(m => ({ default: m.TermsOfUse })));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const ToolsHome = lazy(() => import('../features/tools/ToolsHome'));

const AIHome = lazy(() => import('../features/ai/AIHome').then(m => ({ default: m.AIHome })));

const AIChatPage = lazy(() => import('../features/ai/chat/AIChatPage').then(m => ({ default: m.AIChatPage })));
const AITalkPage = lazy(() => import('../features/ai/talk/AITalkPage').then(m => ({ default: m.AITalkPage })));

const QuizPdfPptGenerator = lazy(() => import('../features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator').then(module => ({ default: module.QuizPdfPptGenerator })));
const FlashcardMaker = lazy(() => import('../features/tools/flashcard-maker/FlashcardMaker'));
const BilingualPdfMaker = lazy(() => import('../features/tools/bilingual-pdf-maker/BilingualPdfMaker'));
const TextExporter = lazy(() => import('../features/tools/text-exporter/TextExporter'));

// Immersive Session Views (No standard layout)
const LearningSession = lazy(() => import('../features/quiz/learning/LearningSession').then(m => ({ default: m.LearningSession })));
const MockSession = lazy(() => import('../features/quiz/mock/MockSession').then(m => ({ default: m.MockSession })));
const GodModeSession = lazy(() => import('../features/quiz/mock/GodModeSession').then(m => ({ default: m.GodModeSession })));
const IdiomSession = lazy(() => import('../features/vocab/idioms/components/IdiomSession').then(m => ({ default: m.IdiomSession })));
const OWSSession = lazy(() => import('../features/vocab/ows/components/OWSSession').then(m => ({ default: m.OWSSession })));

// Vocab Libraries
const VocabLibraryPage = lazy(() => import('../features/vocab/components/VocabLibrary').then(m => ({ default: m.VocabLibrary })));

const DeckSessionGuard = lazy(() => import('../features/vocab/components/DeckSessionGuard').then(m => ({ default: m.DeckSessionGuard })));
const DeckSession = lazy(() => import('../features/vocab/components/DeckSession').then(m => ({ default: m.DeckSession })));
const VocabResult = lazy(() => import('../features/vocab/components/VocabResult').then(m => ({ default: m.VocabResult })));



// Auth & User Management
const AuthPage = lazy(() => import('../features/auth/components/AuthPage'));
const ProfilePage = lazy(() => import('../features/auth/components/ProfilePage'));
const SettingsPage = lazy(() => import('../features/auth/components/SettingsPage'));
const DeleteAccountPage = lazy(() => import('../features/settings/components/DeleteAccountPage').then(m => ({ default: m.DeleteAccountPage })));
const SubscriptionPage = lazy(() => import('../features/auth/components/SubscriptionPage'));
const SupportPage = lazy(() => import('../features/auth/components/SupportPage'));

/**
 * The inner routing logic wrapped in the QuizContext context.
 *
 * Maps URL paths to components and connects navigation actions from the `useQuizContext` hook.
 */
import { AppPreferencesPage } from '@/features/settings';
import { MyReportsPage } from '@/features/settings';
import { QuizSessionGuard } from '@/features/quiz';
import { ResultGuard } from '@/features/quiz';
import { supabase } from '../lib/supabase';
import { ShareGatekeeper } from '@/features/quiz';

const AppRoutesContent: React.FC = () => {
    // Destructure all necessary state and actions from the global store
    const {
        state,
        enterHome, enterConfig, enterEnglishHome, enterIdiomsConfig, enterOWSConfig,
        enterSynonymsConfig,

        enterProfile, enterLogin, goToIntro, startQuiz,
         nextQuestion, prevQuestion, jumpToQuestion, submitSessionResults,
        restartQuiz, goHome, pauseQuiz, resumeQuiz, saveTimer, answerQuestion, toggleBookmark, useFiftyFifty,
        syncGlobalTimer
    } = useQuizContext();

    const { user, signOut } = useAuth();

    const handleQuizComplete = async (results: any, quizId: string) => {
        try {
            await submitSessionResults(results);
            navTo(`/result/${quizId}`);
        } catch (error) {
            useNotificationStore.getState().showToast({
                variant: 'error',
                message: 'Submission failed. Your progress is saved locally. Please try again.',
                duration: 5000
            });
        }
    };

    const navigate = useNavigate();
    const flashcardStore = useFlashcardStore();
    const location = useLocation();

    // Handle hardware back button for Android Native Build
    useHardwareBackButton();

    // Helper: Standardized navigation wrapper
    const navTo = (path: string) => navigate(path);
    // Helper: Reset state and go to Dashboard
    const navHome = () => { goHome(); navigate('/dashboard'); };
const handleReattempt = async (quizId: string, mode: string) => {
        try {
            const { showToast } = useNotificationStore.getState();
            showToast({
                variant: 'info',
                title: 'Cloning Quiz',
                message: 'Preparing your retake...'
            });

            const { data, error } = await supabase.rpc('clone_shared_quiz', {
                p_original_quiz_id: quizId,
                p_name_suffix: ' (Retake)'
            });
            if (error) throw error;
            if (data && data.new_quiz_id) {
                navigate(`/quiz/session/${mode}/${data.new_quiz_id}`);
            }
        } catch (err: any) {
            console.error('Error reattempting quiz:', err);
            const { showToast } = useNotificationStore.getState();
            showToast({
                variant: 'error',
                title: 'Retake Failed',
                message: 'Could not create a retake session.'
            });
        }
    };

    return (
        <Suspense fallback={
            location.pathname === '/'
                ? <div className="min-h-screen w-full bg-white dark:bg-slate-900" />
                : <div className="min-h-screen flex items-center justify-center"><SynapticLoader size="xl" /></div>
        }>
            <Routes>
                {/* --- Public / Landing Route --- */}
                <Route path="/" element={
                    <LandingPage
                        onGetStarted={() => { enterHome(); navTo('/dashboard'); }}
                        onLoginClick={() => { enterLogin(); navTo('/login'); }}
                        user={user}
                        onProfileClick={() => { enterProfile(); navTo('/profile'); }}
                        onSignOut={signOut}
                    />
                } />

                {/* --- Standard Application Routes (Wrapped in QuizLayout) --- */}
                <Route element={<QuizLayout />}>
                                        <Route path="/blueprints" element={<Suspense fallback={<SynapticLoader />}><ExamBlueprintsHub onBack={() => { goHome(); navTo('/dashboard'); }} onLaunchBlueprint={(bp) => { navTo('/blueprints/preview'); }} /></Suspense>} />
                    <Route path="/blueprints/preview/:id" element={<Suspense fallback={<SynapticLoader />}><BlueprintPreviewWrapper /></Suspense>} />
                    <Route path="/dashboard" element={<Suspense fallback={<SynapticLoader />}><Dashboard onBackToIntro={() => { navTo('/dashboard'); }} /></Suspense>} />

                    <Route path="/mcqs" element={<Suspense fallback={<SynapticLoader />}><McqsQuizHome onBack={() => { navTo('/dashboard'); }} /></Suspense>} />
                    <Route path="/about/developer-profile" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <DeveloperProfile />
                        </Suspense>
                    } />
                    <Route path="/about/developer-profile/aalok" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <AalokProfile />
                        </Suspense>
                    } />
                    <Route path="/about/developer-profile/:id" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <TeamMemberProfile />
                        </Suspense>
                    } />

                    <Route path="/about/terms-of-use" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <TermsOfUse />
                        </Suspense>
                    } />
                    <Route path="/about" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <AboutUs />
                        </Suspense>
                    } />
                    <Route path="/privacy-policy" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <PrivacyPolicy />
                        </Suspense>
                    } />



                    <Route path="/english" element={<Suspense fallback={<SynapticLoader />}><EnglishQuizHome onBack={() => { enterHome(); navTo('/dashboard'); }} onIdiomsClick={() => { enterIdiomsConfig(); navTo('/vocab/idioms'); }} onOWSClick={() => { enterOWSConfig(); navTo('/vocab/ows'); }} onSynonymsClick={() => { enterSynonymsConfig(); navTo('/vocab/synonyms'); }} /></Suspense>} />

                    <Route path="/share/:originalQuizId" element={<ShareGatekeeper />} />
                <Route path="/quiz/library" element={<Suspense fallback={<SynapticLoader />}><QuizLibrary /></Suspense>} />
                <Route path="/quiz/saved" element={<Navigate to="/quiz/library?tab=created" replace />} />
                <Route path="/quiz/attempted" element={<Navigate to="/quiz/library?tab=attempted" replace />} />
                    <Route path="/quiz/analytics" element={<Suspense fallback={<SynapticLoader />}><PerformanceAnalytics /></Suspense>} />
                    <Route path="/quiz/bookmarks" element={<Suspense fallback={<SynapticLoader />}><BookmarksPage /></Suspense>} />








                    <Route path="/vocab/synonyms" element={<Suspense fallback={<SynapticLoader />}><SynonymsHub onBack={() => navTo('/english')} onStart={(data, filters, mode) => { flashcardStore.startSynonyms(data, filters, mode); navTo('/vocab/synonyms/session'); }} /></Suspense>} />
                    <Route path="/vocab/ows" element={<Suspense fallback={<SynapticLoader />}><OWSHub onBack={() => navTo('/english')} /></Suspense>} />
                    <Route path="/vocab/idioms" element={<Suspense fallback={<SynapticLoader />}><IdiomsHub onBack={() => navTo('/english')} /></Suspense>} />
                    <Route path="/vocab/synonyms/config" element={
                        <Suspense fallback={<SynapticLoader />}><SynonymsConfig
                            onBack={() => { enterEnglishHome(); navTo('/english'); }}
                            onStart={(data: any, filters: any, mode: any) => {
                                flashcardStore.startSynonyms(data, filters, mode);
                                navTo('/vocab/synonyms/session');
                            }}
                        /></Suspense>
                    } />





                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Suspense fallback={<SynapticLoader />}><ProfilePage
                                onNavigateToSettings={() => navTo('/settings')}
                                onSignOut={() => { navTo('/dashboard'); }}
                            /></Suspense>
                        </ProtectedRoute>
                    } />

                    <Route path="/settings/my-reports" element={<ProtectedRoute><Suspense fallback={<SynapticLoader />}><MyReportsPage /></Suspense></ProtectedRoute>} />
                    <Route path="/settings/deleteaccount" element={
                        <ProtectedRoute>
                            <Suspense fallback={<SynapticLoader />}><DeleteAccountPage /></Suspense>
                        </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                        <ProtectedRoute>
                            <Suspense fallback={<SynapticLoader />}><SettingsPage onBack={() => navTo('/profile')} /></Suspense>
                        </ProtectedRoute>
                    } />

                    <Route path="/profile/subscription" element={
                        <ProtectedRoute>
                            <Suspense fallback={<SynapticLoader />}><SubscriptionPage onBack={() => navTo('/profile')} /></Suspense>
                        </ProtectedRoute>
                    } />

                    <Route path="/profile/support" element={
                        <ProtectedRoute>
                            <Suspense fallback={<SynapticLoader />}><SupportPage onBack={() => navTo('/profile')} /></Suspense>
                        </ProtectedRoute>
                    } />
                    <Route path="/profile/preferences" element={
                        <ProtectedRoute>
                            <Suspense fallback={<SynapticLoader />}><AppPreferencesPage /></Suspense>
                        </ProtectedRoute>
                    } />

                    <Route path="/login" element={
                        <Suspense fallback={<SynapticLoader />}><AuthPage onBack={() => { navTo('/dashboard'); }} /></Suspense>
                    } />

                    <Route path="/result/:quizId" element={
                        <ErrorBoundary><ResultGuard>
                            {state.mode === 'mock' ? (
                            <Suspense fallback={<SynapticLoader />}><MockQuizResult
                                score={state.score}
                                total={state.activeQuestions.length}
                                questions={state.activeQuestions}
                                answers={state.answers}
                                timeTaken={state.timeTaken}
                                bookmarks={state.bookmarks}
                                onRestart={() => handleReattempt(state.quizId!, state.mode)}
                                onGoHome={navHome}
                            /></Suspense>
                        ) : state.mode === 'god' ? (
                            <Suspense fallback={<SynapticLoader />}><GodQuizResult
                                score={state.score}
                                total={state.activeQuestions.length}
                                questions={state.activeQuestions}
                                answers={state.answers}
                                timeTaken={state.timeTaken}
                                bookmarks={state.bookmarks}
                                onRestart={() => handleReattempt(state.quizId!, state.mode)}
                                onGoHome={navHome}
                            /></Suspense>
                        ) : (
                            <Suspense fallback={<SynapticLoader />}><QuizResult
                                score={state.score}
                                total={state.activeQuestions.length}
                                questions={state.activeQuestions}
                                answers={state.answers}
                                timeTaken={state.timeTaken}
                                bookmarks={state.bookmarks}
                                onRestart={() => handleReattempt(state.quizId!, state.mode)}
                                onGoHome={navHome}
                            /></Suspense>
                        )
                    }
                        </ResultGuard></ErrorBoundary>
                    } />

                    <Route path="/flashcards/summary" element={
                        <Suspense fallback={<SynapticLoader />}><FlashcardSummary
                            totalCards={flashcardStore.idioms.length || flashcardStore.ows.length || flashcardStore.synonyms.length || 0}
                            filters={flashcardStore.filters || {} as any}
                            swipeStats={flashcardStore.swipeStats}
                            mode={flashcardStore.mode}
                            flashcardType={flashcardStore.type}
                            onRestart={() => {
                                flashcardStore.resetSession();
                                const dest = flashcardStore.type === 'ows' ? '/vocab/ows/config' : flashcardStore.type === 'synonyms' ? '/vocab/synonyms/config' : '/vocab/idioms/config';
                                navTo(dest);
                            }}
                            onHome={() => {
                                const dest = flashcardStore.type === 'ows' ? '/vocab/ows/config' : flashcardStore.type === 'synonyms' ? '/vocab/synonyms/config' : '/vocab/idioms/config';
                                navTo(dest);
                            }}
                            backText={flashcardStore.type === 'ows' ? 'Back To OWS Config' : flashcardStore.type === 'synonyms' ? 'Back To Synonyms Config' : 'Back To Idioms Config'}
                        /></Suspense>
                    } />


                    {/* School Routes */}
                    <Route path="/community" element={<ProtectedRoute><ErrorBoundary fallbackMessage="The Community feed is temporarily unavailable."><Suspense fallback={<SynapticLoader />}><CommunityFeed /></Suspense></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Messages are temporarily unavailable."><Suspense fallback={<SynapticLoader />}><ChatRooms /></Suspense></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/community/reels" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Reels are temporarily unavailable."><Suspense fallback={<SynapticLoader />}><ReelsFeed /></Suspense></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/community/reels/:id/comments" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Comments are temporarily unavailable."><Suspense fallback={<SynapticLoader />}><ReelCommentsPage /></Suspense></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/community/search" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Search is temporarily unavailable."><Suspense fallback={<SynapticLoader />}><CommunitySearch /></Suspense></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/u/:username" element={<ProtectedRoute><ErrorBoundary><Suspense fallback={<SynapticLoader />}><UserProfile /></Suspense></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/community/post/:id" element={<ProtectedRoute><ErrorBoundary><Suspense fallback={<SynapticLoader />}><PostPage /></Suspense></ErrorBoundary></ProtectedRoute>} />

                    <Route path="/school" element={<Suspense fallback={<SynapticLoader />}><SchoolHomePage /></Suspense>} />
                    <Route path="/school/download" element={<Suspense fallback={<SynapticLoader />}><SchoolDownloads /></Suspense>} />
<Route path="/tools" element={<Suspense fallback={<SynapticLoader />}><ToolsHome /></Suspense>} />
                    <Route path="/notification" element={<Suspense fallback={<SynapticLoader />}><NotificationsPage /></Suspense>} />
                    <Route path="/ai" element={<Suspense fallback={<SynapticLoader />}><AIHome /></Suspense>} />

                    <Route path="/ai/chat" element={<Suspense fallback={<SynapticLoader />}><AIChatPage /></Suspense>} />
                    <Route path="/ai/talk" element={<Suspense fallback={<SynapticLoader />}><AITalkPage /></Suspense>} />
                    <Route path="/tools/bilingual-pdf-maker" element={<Suspense fallback={<SynapticLoader />}><BilingualPdfMaker /></Suspense>} />
                    <Route path="/tools/text-exporter" element={<Suspense fallback={<SynapticLoader />}><TextExporter /></Suspense>} />
                    <Route path="/tools/quiz-pdf-ppt-generator" element={<Suspense fallback={<SynapticLoader />}><QuizPdfPptGenerator /></Suspense>} />
                </Route>

                {/* --- Immersive Session Routes (No Layout, Fullscreen) --- */}


                    {/* Vocab Libraries */}
                    <Route path="/vocab/ows/library" element={<Suspense fallback={<SynapticLoader />}><VocabLibraryPage vocabType="ows" onBack={() => navTo('/vocab/ows')} onStartDeck={(id) => { navTo(`/vocab/ows/session/${id}`); }} /></Suspense>} />
                    <Route path="/vocab/idioms/library" element={<Suspense fallback={<SynapticLoader />}><VocabLibraryPage vocabType="idiom" onBack={() => navTo('/vocab/idioms')} onStartDeck={(id) => { navTo(`/vocab/idioms/session/${id}`); }} /></Suspense>} />
                    <Route path="/vocab/synonyms/library" element={<Suspense fallback={<SynapticLoader />}><VocabLibraryPage vocabType="synonym" onBack={() => navTo('/vocab/synonyms')} onStartDeck={(id) => { navTo(`/vocab/synonyms/session/${id}`); }} /></Suspense>} />


                    <Route path="/vocab/ows/session/:deckId" element={<Suspense fallback={<SynapticLoader />}><DeckSessionGuard vocabType="ows"><DeckSession /></DeckSessionGuard></Suspense>} />
                    <Route path="/vocab/idioms/session/:deckId" element={<Suspense fallback={<SynapticLoader />}><DeckSessionGuard vocabType="idiom"><DeckSession /></DeckSessionGuard></Suspense>} />
                    <Route path="/vocab/synonyms/session/:deckId" element={<Suspense fallback={<SynapticLoader />}><DeckSessionGuard vocabType="synonym"><DeckSession /></DeckSessionGuard></Suspense>} />

                    <Route path="/vocab/ows/result/:deckId" element={<Suspense fallback={<SynapticLoader />}><VocabResult vocabType="ows" /></Suspense>} />
                    <Route path="/vocab/idioms/result/:deckId" element={<Suspense fallback={<SynapticLoader />}><VocabResult vocabType="idiom" /></Suspense>} />
                    <Route path="/vocab/synonyms/result/:deckId" element={<Suspense fallback={<SynapticLoader />}><VocabResult vocabType="synonym" /></Suspense>} />

<Route path="/vocab/idioms/config" element={
                        <Suspense fallback={<SynapticLoader />}><IdiomsConfig
                            onBack={() => { enterEnglishHome(); navTo('/english'); }}
                            onStart={(data, filters, mode) => {
                                flashcardStore.startIdioms(data as any, filters, mode as 'basic' | 'review');
                                navTo('/vocab/idioms/session');
                            }}
                        /></Suspense>
                    } />

                    <Route path="/vocab/ows/config" element={
                        <Suspense fallback={<SynapticLoader />}><OWSConfig
                            onBack={() => { enterEnglishHome(); navTo('/english'); }}
                            onStart={(data, filters, mode) => {
                                flashcardStore.startOWS(data, filters, mode as 'basic' | 'review');
                                navTo('/vocab/ows/session');
                            }}
                        /></Suspense>
                    } />



                    <Route path="/share/:originalQuizId" element={<Suspense fallback={<SynapticLoader />}><ShareGatekeeper /></Suspense>} />

                    <Route path="/quiz/config" element={
                        <Suspense fallback={<SynapticLoader />}><QuizConfig
                            onBack={() => { navTo('/mcqs'); }}
                            onStart={(questions, filters, mode, quizName) => {
                                // Note: QuizConfig uses saveQuiz directly and navigates, so this might not be hit, but we pass random UUID just in case
                                startQuiz(questions, filters || ({} as any), mode, crypto.randomUUID(), quizName);
                                navTo(`/quiz/session/${mode}/${state.quizId}`);
                            }}
                        /></Suspense>
                    } />


                {/* Learning Mode: Interactive per-question session */}
                <Route path="/quiz/live/:id" element={<Suspense fallback={<SynapticLoader />}><LiveQuizRoom /></Suspense>} />

                <Route path="/quiz/session/learning/:quizId" element={
                    <QuizSessionGuard>
                        <LearningSession
                            questions={state.activeQuestions}
                            filters={state.filters || {} as any}
                            remainingTimes={state.remainingTimes}
                            isPaused={Boolean(state.isPaused)}
                            currentIndex={state.currentQuestionIndex}
                            answers={state.answers}
                            bookmarks={state.bookmarks}
                            timeTaken={state.timeTaken}
                            onAnswer={answerQuestion}
                            onNext={nextQuestion}
                            onPrev={prevQuestion}
                            onJump={jumpToQuestion}
                            onToggleBookmark={toggleBookmark}
                            onComplete={async (results: any) => await handleQuizComplete(results, state.quizId!)}
                            onGoHome={navHome}
                            onPause={pauseQuiz}
                            onResume={resumeQuiz}
                            onSaveTimer={saveTimer}
                            onFiftyFifty={useFiftyFifty}
                            quizName={state.quizName}
                            hiddenOptions={state.hiddenOptions || {}}
                        />
                    </QuizSessionGuard>
                } />

                {/* Mock Mode: Timed exam simulation */}
                <Route path="/quiz/session/mock/:quizId" element={
                    <QuizSessionGuard>
                        <MockSession
                            questions={state.activeQuestions}
                            initialTime={state.quizTimeRemaining}
                            onPause={(timeLeft) => {
                                syncGlobalTimer(timeLeft);
                                pauseQuiz();
                                setTimeout(() => navTo('/quiz/library?tab=created'), 100);
                            }}
                            onComplete={async (results: any) => await handleQuizComplete(results, state.quizId!)}
                        />
                    </QuizSessionGuard>
                } />

                {/* God Mode: Stricter timed blueprint simulation */}
                <Route path="/quiz/session/god/:quizId" element={
                    <QuizSessionGuard>
                        <GodModeSession
                            questions={state.activeQuestions}
                            initialTime={state.quizTimeRemaining}
                            onComplete={async (results: any) => await handleQuizComplete(results, state.quizId!)}
                        />
                    </QuizSessionGuard>
                } />

                {/* Flashcard Sessions */}
                <Route path="/vocab/idioms/session" element={
                    <IdiomSession
                        data={flashcardStore.idioms}
                        currentIndex={flashcardStore.currentIndex}
                        onNext={flashcardStore.nextCard}
                        onPrev={flashcardStore.prevCard}
                        onExit={navHome}
                        onFinish={() => { flashcardStore.finishSession(); navTo('/flashcards/summary'); }}
                        filters={flashcardStore.filters || {} as any}
                        onJump={flashcardStore.jumpToCard}
                    />
                } />



                <Route path="/vocab/synonyms/session" element={
                    <SynonymFlashcardSession
                        data={flashcardStore.synonyms}
                        currentIndex={flashcardStore.currentIndex}
                        onNext={flashcardStore.nextCard}
                        onPrev={flashcardStore.prevCard}
                        onExit={() => navTo('/vocab/synonyms')}
                        onFinish={() => { flashcardStore.finishSession(); navTo('/flashcards/summary'); }}
                        filters={flashcardStore.filters || {} as any}
                        onJump={flashcardStore.jumpToCard}
                    />
                } />

                <Route path="/vocab/synonyms/phase1" element={<Suspense fallback={<SynapticLoader />}><SynonymPhase1Session /></Suspense>} />
                <Route path="/vocab/synonyms/list" element={<Suspense fallback={<SynapticLoader />}><SynonymClusterList data={flashcardStore.synonyms} onSelectWord={(word) => { flashcardStore.jumpToCard(flashcardStore.synonyms.findIndex(w => w.id === word.id) || 0); navTo('/vocab/synonyms/session'); }} onExit={() => navTo('/vocab/synonyms')} /></Suspense>} />
                <Route path="/vocab/synonyms/quiz" element={<Suspense fallback={<SynapticLoader />}><SynonymQuizSession onExit={() => navTo('/vocab/synonyms')} /></Suspense>} />


                <Route path="/vocab/ows/session" element={
                    <OWSSession
                        data={flashcardStore.ows}
                        currentIndex={flashcardStore.currentIndex}
                        onNext={flashcardStore.nextCard}
                        onPrev={flashcardStore.prevCard}
                        onExit={() => navTo('/vocab/ows/config')}
                        onFinish={() => { flashcardStore.finishSession(); navTo('/flashcards/summary'); }}
                        filters={flashcardStore.filters || {} as any}
                        onJump={flashcardStore.jumpToCard}
                    />
                } />

                                <Route path="/tools/flashcard-maker" element={<Suspense fallback={<SynapticLoader />}><FlashcardMaker /></Suspense>} />

                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" replace />} />

                    <Route path="/admin" element={<Suspense fallback={<SynapticLoader />}><AdminHomePage /></Suspense>} />
                    <Route path="/admin/reports" element={<Suspense fallback={<SynapticLoader />}><AdminReportsQueue /></Suspense>} />
                                        <Route path="/admin/materials" element={<Suspense fallback={<SynapticLoader />}><AdminManageMaterials /></Suspense>} />
                    <Route path="/admin/upload" element={<Suspense fallback={<SynapticLoader />}><AdminUploadMaterials /></Suspense>} />
                    <Route path="/admin/uploadgk" element={<Suspense fallback={<SynapticLoader />}><AdminUploadGK /></Suspense>} />
                    <Route path="/admin/upload-ows" element={<Suspense fallback={<SynapticLoader />}><AdminUploadOWS /></Suspense>} />
                    <Route path="/admin/upload-idioms" element={<Suspense fallback={<SynapticLoader />}><AdminUploadIdioms /></Suspense>} />
                    <Route path="/admin/upload-synonyms" element={<Suspense fallback={<SynapticLoader />}><AdminUploadSynonyms /></Suspense>} />
              <Route path="/admin/notifications" element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><SynapticLoader size="md" /></div>}>
              <AdminNotifications />
            </Suspense>
          } />
        (</Routes>)
        </Suspense>
    );
};

/**
 * The root Routes component.
 * Wraps the application routes with the QuizProvider context.
 */
export const AppRoutes: React.FC = () => {
    return (
        <QuizProvider>
            <AppRoutesContent />
        </QuizProvider>
    );
};
