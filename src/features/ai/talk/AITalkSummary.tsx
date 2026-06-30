import React from 'react';
import { Clock, MessageSquare, RotateCcw, Home } from 'lucide-react';
import { ChatMessage } from './useLiveAPI';
import { useNavigate } from 'react-router-dom';

interface AITalkSummaryProps {
    duration: number;
    transcript: ChatMessage[];
    onRestart: () => void;
}

export const AITalkSummary: React.FC<AITalkSummaryProps> = ({ duration, transcript, onRestart }) => {
    const navigate = useNavigate();

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="h-[100dvh] bg-stone-900 flex flex-col p-4 sm:p-6 animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden text-stone-200">
            {/* Background elements */}
            <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-100px] right-[-100px] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <header className="text-center mt-4 sm:mt-8 mb-6 sm:mb-10 z-10 shrink-0">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-stone-800 border-2 border-emerald-500/30 mb-2 sm:mb-4 shadow-lg shadow-emerald-900/20">
                    <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Session Complete</h1>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-8 z-10 shrink-0">
                <div className="bg-stone-800/80 backdrop-blur border border-stone-700 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Clock className="w-6 h-6 text-indigo-400 mb-2" />
                    <span className="text-2xl font-mono font-bold text-white">{formatTime(duration)}</span>
                    <span className="text-xs text-stone-400 uppercase tracking-widest mt-1">Duration</span>
                </div>
                <div className="bg-stone-800/80 backdrop-blur border border-stone-700 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <MessageSquare className="w-6 h-6 text-amber-400 mb-2" />
                    <span className="text-2xl font-mono font-bold text-white">{transcript.filter(t => t.role === 'model').length}</span>
                    <span className="text-xs text-stone-400 uppercase tracking-widest mt-1">Exchanges</span>
                </div>
            </div>

            {/* AI Transcript Highlights */}
            <div className="flex-1 min-h-0 bg-stone-800/50 border border-stone-700 rounded-3xl p-4 sm:p-6 overflow-hidden flex flex-col z-10">
                <h3 className="text-xs sm:text-sm font-bold text-stone-300 uppercase tracking-wider mb-2 sm:mb-4 border-b border-stone-700 pb-2 shrink-0">AI Transcript Highlights</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-stone-600">
                    {transcript.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-stone-500 text-sm italic">
                            No transcript available for this session.
                        </div>
                    ) : (
                        transcript.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'model' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                    msg.role === 'model'
                                        ? 'bg-stone-700/50 text-stone-200 rounded-tl-none'
                                        : 'bg-indigo-900/40 text-indigo-100 rounded-tr-none border border-indigo-800/30'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 sm:mt-8 mb-2 sm:mb-4 flex gap-3 sm:gap-4 z-10 w-full max-w-md mx-auto shrink-0">
                <button
                    onClick={onRestart}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                >
                    <RotateCcw className="w-5 h-5" />
                    New Session
                </button>
                <button
                    onClick={() => navigate('/ai')}
                    className="flex-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                >
                    <Home className="w-5 h-5" />
                    AI Home
                </button>
            </div>
        </div>
    );
};
