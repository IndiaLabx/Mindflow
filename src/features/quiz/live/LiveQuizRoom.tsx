import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, Settings, AlertCircle, Volume2, User, Loader2, Captions, ChevronLeft } from 'lucide-react';
import { useGenAILive, VoicePersonality } from './useGenAILive';
import { SavedQuiz } from '../types';
import { db } from '../../../lib/db';
import { VoiceBlobVisualizer } from '../../ai/talk/VoiceBlobVisualizer';
import { cn } from '../../../utils/cn';

export const LiveQuizRoom: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<SavedQuiz | null>(null);
    const [loading, setLoading] = useState(true);

    const [showSubtitles, setShowSubtitles] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);

    const {
        connectionState,
        agentState,
        errorMsg,
        userAnalyser,
        aiAnalyser,
        isMuted,
        voiceName,
        currentSubtitle,
        connect,
        disconnect,
        toggleMute,
        changeVoice
    } = useGenAILive({ quiz });

    useEffect(() => {
        const loadQuiz = async () => {
            if (!id) return;
            try {
                const quizzes: any[] = [];
                const foundQuiz = quizzes.find(q => q.id === id);
                if (foundQuiz) {
                    setQuiz(foundQuiz);
                } else {
                    console.error("Quiz not found");
                    navigate('/quiz/library?tab=created');
                }
            } catch (error) {
                console.error("Failed to load quiz:", error);
                navigate('/quiz/library?tab=created');
            } finally {
                setLoading(false);
            }
        };
        loadQuiz();
    }, [id, navigate]);

    // Timer for "LIVE | 00:00"
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (connectionState === 'connected') {
            interval = setInterval(() => {
                setSecondsElapsed(prev => prev + 1);
            }, 1000);
        } else {
            setSecondsElapsed(0);
        }
        return () => clearInterval(interval);
    }, [connectionState]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleToggleConnection = () => {
        if (connectionState === 'connected') {
            disconnect();
        } else {
            connect();
        }
    };

    const isActiveSpeaking = agentState === 'speaking';

    const getStatusText = () => {
        if (connectionState === 'error') return "Connection Failed";
        if (connectionState === 'connecting') return "Establishing secure connection...";
        if (connectionState === 'connected') {
            if (isActiveSpeaking) return "Quiz Master is speaking...";
            if (isMuted) return "Microphone is muted";
            return "Quiz Master is listening...";
        }
        return "Ready to Start Quiz";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[100dvh] bg-stone-950">
                <Loader2 className="animate-spin h-12 w-12 text-indigo-500" />
            </div>
        );
    }

    if (!quiz) return null;

    const VOICES: VoicePersonality[] = ['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck'];

    return (
        <div className="flex flex-col h-[100dvh] bg-stone-950 text-stone-100 overflow-hidden relative font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={cn(
                    "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] transition-all duration-1000 opacity-20",
                    isActiveSpeaking ? "bg-indigo-600 scale-110" : "bg-stone-800 scale-100"
                )} />
                <div className={cn(
                    "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] transition-all duration-1000 opacity-20",
                    isMuted ? "bg-red-900 scale-110" : "bg-emerald-900 scale-100"
                )} />
            </div>

            {/* Header */}
            <header className="w-full flex justify-between items-center p-6 z-20">
                <button
                    onClick={() => {
                        disconnect();
                        navigate('/quiz/library?tab=created');
                    }}
                    className="p-3 bg-stone-900/50 hover:bg-stone-800 text-stone-300 rounded-full transition-colors backdrop-blur-md border border-stone-800"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Voice Selection */}
                <div className="relative">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-3 bg-stone-900/50 hover:bg-stone-800 text-stone-300 rounded-full transition-colors backdrop-blur-md border border-stone-800"
                        title="Voice Settings"
                    >
                        <Settings className="w-6 h-6" />
                    </button>

                    {showSettings && (
                        <div className="absolute top-full right-0 mt-4 w-72 bg-stone-900/95 backdrop-blur-xl border border-stone-800 rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2">
                            <h3 className="text-stone-300 text-sm font-semibold uppercase tracking-wider mb-4">Quiz Master Voice</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {VOICES.map(v => (
                                    <button
                                        key={v}
                                        onClick={() => changeVoice(v)}
                                        className={cn(
                                            "px-3 py-2 rounded-lg text-sm font-bold transition-all duration-300 border text-center",
                                            voiceName === v ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-inner" : "bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700"
                                        )}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
            </header>

            {/* Top Status Indicator */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10 w-full max-w-md px-4">
                {connectionState === 'connected' ? (
                     <div className="flex items-center gap-2 bg-stone-800/80 backdrop-blur-md border border-stone-700 px-4 py-2 rounded-full shadow-lg">
                        <span className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            isMuted ? "bg-red-500" : "bg-emerald-500"
                        )} />
                        <span className="text-sm font-medium text-white tracking-widest font-mono">LIVE | {formatTime(secondsElapsed)}</span>
                     </div>
                ) : connectionState === 'error' ? (
                    <div className="flex items-center gap-2 text-red-400 bg-red-950/50 border border-red-900/50 px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium text-center shadow-lg">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{errorMsg || 'Connection failed'}</span>
                    </div>
                ) : (
                    <div className="text-stone-400 text-sm tracking-widest uppercase font-bold text-center">
                         {quiz.name || 'Untitled Quiz'}
                    </div>
                )}

                <div className={cn(
                    "text-lg font-medium transition-colors duration-300 h-8 mt-2",
                    connectionState === 'connected' ? (isActiveSpeaking ? "text-indigo-400 animate-pulse" : (isMuted ? "text-red-400" : "text-emerald-400")) : "text-stone-500"
                )}>
                    {getStatusText()}
                </div>
            </div>

            {/* Main Visualizer Avatar Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto relative z-10 mb-6 mt-4">
                <div className="relative flex items-center justify-center w-64 h-64">
                    {/* HTML5 Canvas Dynamic Blob Visualizer */}
                    <VoiceBlobVisualizer
                        userAnalyser={userAnalyser}
                        aiAnalyser={aiAnalyser}
                        agentState={agentState}
                        connectionState={connectionState}
                        isMuted={isMuted}
                    />

                    {/* Main Avatar / Connect Button - layered over canvas */}
                    <button
                        onClick={connectionState !== 'connected' ? handleToggleConnection : undefined}
                        disabled={connectionState === 'connecting'}
                        className={cn(
                            "relative z-20 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform border-4 border-stone-800/80 backdrop-blur-sm",
                            connectionState === 'idle' || connectionState === 'disconnected' || connectionState === 'error'
                                ? "bg-stone-800 hover:bg-stone-700 hover:scale-105 cursor-pointer text-stone-300"
                                : connectionState === 'connecting'
                                ? "bg-stone-800 scale-95 cursor-wait"
                                : isActiveSpeaking
                                ? "bg-indigo-600/20 text-indigo-100 scale-100 cursor-default border-indigo-500/30"
                                : isMuted ? "bg-red-600/20 text-red-100 border-red-500/30" : "bg-emerald-600/20 text-emerald-100 border-emerald-500/30"
                        )}
                     aria-label="Toggle connection">
                        {connectionState === 'connecting' ? (
                            <Loader2 className="w-12 h-12 animate-spin text-stone-400" />
                        ) : connectionState === 'connected' ? (
                            isActiveSpeaking ? (
                                <User className="w-12 h-12 opacity-90" />
                            ) : (
                                <Mic className="w-12 h-12 opacity-90" />
                            )
                        ) : (
                            <Mic className="w-12 h-12" />
                        )}
                    </button>
                </div>
            </div>

            {/* Subtitles Overlay */}
            <div className="w-full max-w-lg mx-auto px-6 min-h-[80px] flex flex-col items-center justify-end z-20 pointer-events-none">
                 {showSubtitles && currentSubtitle && connectionState === 'connected' && (
                     <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center animate-in fade-in slide-in-from-bottom-2 shadow-2xl w-full max-w-full overflow-hidden flex flex-col justify-end" style={{ maxHeight: '140px' }}>
                         <div
                             className="overflow-y-auto pointer-events-auto scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-transparent flex flex-col justify-end pr-2"
                             ref={(el) => {
                                 if (el) {
                                     el.scrollTop = el.scrollHeight;
                                 }
                             }}
                         >
                             <p className="text-white text-lg font-medium leading-relaxed drop-shadow-md pb-1 whitespace-pre-wrap">
                                 {currentSubtitle}
                             </p>
                         </div>
                     </div>
                 )}
            </div>

            {/* Bottom Controls */}
            <div className="w-full max-w-md mx-auto pb-6 z-20 flex flex-col items-center gap-6">
                 {connectionState === 'connected' ? (
                    <div className="flex items-center justify-center gap-6 w-full px-4 animate-in fade-in slide-in-from-bottom-4">
                        {/* CC Toggle */}
                        <button
                            onClick={() => setShowSubtitles(!showSubtitles)}
                            className={cn(
                                "p-4 rounded-full transition-all duration-200 shadow-lg",
                                showSubtitles
                                    ? 'bg-stone-800 text-indigo-400 border border-indigo-900/50 hover:bg-stone-700'
                                    : 'bg-stone-800 text-stone-500 border border-stone-700 hover:bg-stone-700 hover:text-stone-300'
                            )}
                            title={showSubtitles ? "Hide Subtitles" : "Show Subtitles"}
                        >
                            <Captions className="w-6 h-6" />
                        </button>

                        {/* End Call Button */}
                        <button
                            onClick={handleToggleConnection}
                            className="p-6 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg hover:shadow-red-900/50 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center border-4 border-stone-900"
                            title="End Conversation"
                         aria-label="Toggle connection">
                            <PhoneOff className="w-8 h-8" />
                        </button>

                        {/* Mute Button */}
                        <button
                            onClick={toggleMute}
                            className={cn(
                                "p-4 rounded-full transition-all duration-200 shadow-lg border",
                                isMuted
                                    ? 'bg-red-950/50 text-red-400 border-red-900/50 hover:bg-red-900/50'
                                    : 'bg-stone-800 text-emerald-400 border-emerald-900/30 hover:bg-stone-700 hover:text-emerald-300'
                            )}
                            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                         aria-label="Toggle microphone">
                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>

                    </div>
                 ) : (
                    <button
                        onClick={handleToggleConnection}
                        className="bg-emerald-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-1 active:translate-y-0 w-full max-w-[280px]"
                    >
                        Start Quiz Master
                    </button>
                 )}
            </div>
        </div>
    );
};
