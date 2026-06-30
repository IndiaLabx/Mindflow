import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, ArrowLeft, Loader2, AlertCircle, Volume2, User, PhoneOff, Settings2, Captions, ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useLiveAPI, VoicePersonality } from './useLiveAPI';
import { VoiceBlobVisualizer } from './VoiceBlobVisualizer';
import { AITalkSummary } from './AITalkSummary';

export const AITalkPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        connectionState,
        agentState,
        errorMsg,
        userAnalyser,
        aiAnalyser,
        isMuted,
        voiceName,
        currentSubtitle,
        transcript,
        connect,
        disconnect,
        toggleMute,
        changeVoice,
    } = useLiveAPI();

    // UI States
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);
    const finalDurationRef = useRef(0);

    useEffect(() => {
        if (connectionState === 'connected') {
            setSessionEnded(false);
            setSecondsElapsed(0);
            timerRef.current = setInterval(() => {
                setSecondsElapsed(prev => prev + 1);
            }, 1000);
        } else if (connectionState === 'disconnected' && secondsElapsed > 0 && !errorMsg) {
             // Successfully ended a session that lasted > 0s
             finalDurationRef.current = secondsElapsed;
             setSessionEnded(true);
             if (timerRef.current) clearInterval(timerRef.current);
             setSecondsElapsed(0);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setSecondsElapsed(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [connectionState]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleToggleConnection = () => {
        if (connectionState === 'connected' || connectionState === 'connecting') {
            disconnect();
        } else {
            connect();
        }
    };

    const handleRestart = () => {
        setSessionEnded(false);
        setSecondsElapsed(0);
    };

    const getStatusText = () => {
        if (connectionState === 'error') return 'Connection Error';
        if (connectionState === 'connecting') return 'Connecting...';
        if (connectionState === 'connected') {
            if (agentState === 'speaking') return 'AI is speaking...';
            if (agentState === 'listening') return isMuted ? 'Microphone Muted' : 'Listening...';
            return 'Ready';
        }
        return 'Tap to Start';
    };

    const isActiveSpeaking = agentState === 'speaking';

    const voices: VoicePersonality[] = ['Aoede', 'Puck', 'Fenrir', 'Kore'];

    if (sessionEnded) {
        return (
            <AITalkSummary
                duration={finalDurationRef.current}
                transcript={transcript}
                onRestart={handleRestart}
            />
        );
    }

    return (
        <div className="min-h-[100dvh] bg-stone-900 flex flex-col items-center justify-between p-4 animate-fade-in relative overflow-hidden font-sans">

            {/* Ambient Background Glow based on state */}
            <div className={cn(
                "absolute inset-0 opacity-30 transition-all duration-1000 ease-in-out pointer-events-none",
                isActiveSpeaking ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/50 via-stone-900 to-stone-900" :
                (connectionState === 'connected' && !isMuted) ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/40 via-stone-900 to-stone-900" :
                "bg-stone-900"
            )} />

            {/* Header */}
            <header className="w-full max-w-2xl mx-auto flex items-center justify-between mt-2 z-20">
                <button
                    onClick={() => {
                        disconnect();
                        navigate(-1);
                    }}
                    className="p-3 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                {/* Options Menu Toggle */}
                {connectionState !== 'connected' && connectionState !== 'connecting' && (
                     <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 bg-stone-800 border border-stone-700 hover:bg-stone-700 px-4 py-2 rounded-full text-sm font-medium text-stone-300 transition-colors shadow-lg"
                        >
                            <Settings2 className="w-4 h-4" />
                            Settings
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                                {/* Topic Select */}


                                {/* Voice Select */}
                                <div>
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">AI Voice</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {voices.map(v => (
                                            <button
                                                key={v}
                                                onClick={() => changeVoice(v)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 border",
                                                    voiceName === v ? "bg-stone-700 border-stone-600 text-white shadow-inner" : "bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700"
                                                )}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                     </div>
                )}

                <div className="w-12" /> {/* Spacer */}
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
                         MindFlow AI
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
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10 my-20">

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
            <div className="w-full max-w-lg px-6 min-h-[80px] mb-8 flex flex-col items-center justify-end z-20 pointer-events-none">
                 {showSubtitles && currentSubtitle && connectionState === 'connected' && (
                     <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center animate-in fade-in slide-in-from-bottom-2 shadow-2xl w-full max-w-full overflow-hidden flex flex-col justify-end" style={{ maxHeight: '100px' }}>
                         <div
                             className="overflow-y-auto pointer-events-auto scrollbar-hide flex flex-col justify-end"
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
            <div className="w-full max-w-md pb-8 z-20 flex flex-col items-center gap-6">
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
                    <>
                    <button
                        onClick={handleToggleConnection}
                        className="bg-emerald-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-1 active:translate-y-0 w-full max-w-[280px]"
                    >
                        Start Conversation
                    </button>
                    {connectionState !== 'error' && (
                        <p className="text-center text-sm text-stone-500 max-w-[250px] font-medium mt-2 animate-pulse">
                            Microphone test is active. Speak to test levels.
                        </p>
                    )}
                    </>
                 )}
            </div>
        </div>
    );
};
