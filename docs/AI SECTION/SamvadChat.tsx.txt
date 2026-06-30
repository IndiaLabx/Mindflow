import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { KINGS_DATA } from '../data';
import { Icons } from './Icons';

/**
 * Props for the SamvadChat component.
 */
interface SamvadChatProps {
  /** Whether the chat overlay is open. */
  isOpen: boolean;
  /** Callback to close the chat. */
  onClose: () => void;
  /** The ID of the historical figure being simulated. */
  figureId: string | null;
}

// --- Audio Helper Functions ---

/**
 * Converts a Base64 string to a Uint8Array.
 * @param base64 - The Base64 string.
 * @returns The resulting Uint8Array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts Float32 audio data to 16-bit PCM ArrayBuffer.
 * @param float32Array - The float audio data.
 * @returns The 16-bit PCM buffer.
 */
function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 * @param buffer - The buffer to convert.
 * @returns The Base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// AudioWorklet Processor Code as a string
const AudioRecorderWorkletCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // Send chunks of ~2048 samples
    this.buffer = new Float32Array(this.bufferSize);
    this.index = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.index++] = channelData[i];
        if (this.index >= this.bufferSize) {
          // Post buffer to main thread
          this.port.postMessage(this.buffer);
          this.index = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('recorder-worklet', RecorderProcessor);
`;

/**
 * Plays sound effects for UI interactions.
 * @param ctx - The audio context.
 * @param type - The type of sound effect ('click', 'connect', 'disconnect').
 */
const playSfx = (ctx: AudioContext | null, type: 'click' | 'connect' | 'disconnect') => {
  if (!ctx || ctx.state === 'closed') return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'connect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'disconnect') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    // Ignore sfx errors
  }
};

/**
 * A voice chat interface that simulates a conversation with a historical figure using Google's Gemini Live API.
 * Features real-time audio visualization, voice input, and audio response.
 *
 * @param props - The component props.
 * @returns The rendered voice chat interface.
 */
const SamvadChat: React.FC<SamvadChatProps> = ({ isOpen, onClose, figureId }) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');
  
  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  
  // Ref to track the unique ID of the current connection attempt
  const connectionIdRef = useRef<number>(0);
  
  // Track actual connection status for audio loop
  const isConnectedRef = useRef<boolean>(false);
  const hasErrorRef = useRef<boolean>(false);

  // Refs for Visualizers
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const aiAnalyserRef = useRef<AnalyserNode | null>(null);
  const userCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aiVisualizerRef = useRef<HTMLDivElement | null>(null); // The glow element
  const aiVisualizerRingRef = useRef<HTMLDivElement | null>(null); // The ripple ring
  const animationFrameRef = useRef<number>(0);

  const figure = figureId ? KINGS_DATA[figureId] : null;
  const imagePath = figure?.imageUrl ? `${(import.meta as any).env.BASE_URL}${figure.imageUrl}` : '';

  // Cleanup function
  const cleanup = () => {
    // Increment ID to invalidate any pending 'onopen' callbacks
    connectionIdRef.current++;
    isConnectedRef.current = false;
    hasErrorRef.current = false;
    
    // RESET AUDIO TIMING CURSOR
    nextStartTimeRef.current = 0; 
    
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      sessionRef.current = null;
    }
    
    if (workletNodeRef.current) {
        try {
            workletNodeRef.current.port.postMessage("stop");
            workletNodeRef.current.disconnect();
        } catch (e) {}
        workletNodeRef.current = null;
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    
    // Stop all queued audio
    audioQueueRef.current.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    audioQueueRef.current = [];
    
    // CRITICAL: Clear analyser nodes to prevent 'different audio context' errors on retry
    userAnalyserRef.current = null;
    aiAnalyserRef.current = null;
    
    setStatus('disconnected');
    setErrorMessage(null);
    setAiSpeaking(false);
  };

  useEffect(() => {
    if (isOpen && figure) {
      startSession();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen, figureId, voiceGender]);

  // Animation Loop for Visualizers
  useEffect(() => {
    if (status !== 'connected') return;

    const animate = () => {
      // 1. Visualize User Mic (Frequency Bars)
      if (userAnalyserRef.current && userCanvasRef.current) {
        const canvas = userCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = userAnalyserRef.current;
        
        if (ctx) {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          const bars = 32; // More bars for smoother look
          const gap = 3;
          const totalGap = (bars - 1) * gap;
          const barWidth = (canvas.width - totalGap) / bars;
          const step = Math.floor(bufferLength / bars);

          const isActive = !isMicMuted;
          
          for (let i = 0; i < bars; i++) {
            let sum = 0;
            for(let j=0; j<step; j++) {
                const index = Math.floor(i * step + j);
                if (index < dataArray.length) {
                    sum += dataArray[index];
                }
            }
            const avg = sum / step;
            
            // Normalize and boost
            const val = isActive ? (avg / 255) : 0; 
            const noise = isActive ? 0.05 : (Math.random() * 0.02);
            
            const barHeight = Math.max(2, (val * 1.5 + noise) * canvas.height);
            
            // Gradient Color
            const opacity = 0.3 + (val * 0.7);
            ctx.fillStyle = isActive 
                ? `rgba(249, 115, 22, ${opacity})` // Orange
                : `rgba(120, 113, 108, 0.2)`; // Stone

            const x = i * (barWidth + gap);
            const y = (canvas.height - barHeight) / 2;
            
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 20);
            ctx.fill();
          }
        }
      }

      // 2. Visualize AI Speech (Glow/Scale)
      if (aiAnalyserRef.current && aiVisualizerRef.current && aiVisualizerRingRef.current) {
        const analyser = aiAnalyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Threshold: only animate if average > 10
        const isActive = average > 10;
        const scale = isActive ? 1 + (average / 255) * 0.5 : 1;
        const opacity = isActive ? 0.4 + (average / 255) * 0.6 : 0;
        
        // Inner Glow
        aiVisualizerRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
        aiVisualizerRef.current.style.opacity = opacity.toString();
        
        // Outer Ring Ripple
        const ringScale = isActive ? 1 + (average / 255) * 1.2 : 1;
        const ringOpacity = isActive ? (average / 255) * 0.4 : 0;
        aiVisualizerRingRef.current.style.transform = `translate(-50%, -50%) scale(${ringScale})`;
        aiVisualizerRingRef.current.style.opacity = ringOpacity.toString();
        
        if (isActive) {
            const spread = (average / 255) * 60;
            aiVisualizerRef.current.style.boxShadow = `0 0 ${spread}px ${spread/2}px rgba(249, 115, 22, 0.6)`;
        } else {
            aiVisualizerRef.current.style.boxShadow = 'none';
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [status, isMicMuted]);

  const startSession = async () => {
    if (!figure) return;
    
    if (!process.env.API_KEY) {
      console.error("API Key missing");
      setStatus('error');
      setErrorMessage("Missing API Key");
      return;
    }

    const currentConnectionId = ++connectionIdRef.current;
    setStatus('connecting');
    setErrorMessage(null);
    hasErrorRef.current = false;

    try {
      // 1. Initialize Audio Context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000, 
      });

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const blob = new Blob([AudioRecorderWorkletCode], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioContextRef.current.audioWorklet.addModule(workletUrl);

      // 2. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // 3. Prepare System Instruction
      const contextContent = figure.content?.replace(/<[^>]*>?/gm, ' ') || "Historical figure.";
      const systemInstruction = `You are ${figure.summary.title}. 
      Reign: ${figure.summary.reign}. 
      Context: ${contextContent.substring(0, 1000)}.
      
      Roleplay rules:
      1. Speak in the first person ("I").
      2. Use a tone befitting a ruler of your era.
      3. Keep answers conversational and concise (2-3 sentences mostly).
      4. Do not break character.
      `;

      // Select voice based on gender state
      const voiceName = voiceGender === 'male' ? 'Fenrir' : 'Kore';

      // 4. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: async () => {
            if (connectionIdRef.current !== currentConnectionId) return;

            isConnectedRef.current = true;
            setStatus('connected');
            playSfx(audioContextRef.current, 'connect');
            
            try {
              mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
              
              if (connectionIdRef.current !== currentConnectionId || !audioContextRef.current) return;

              sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
              
              userAnalyserRef.current = audioContextRef.current.createAnalyser();
              userAnalyserRef.current.fftSize = 64; // Smaller FFT for fewer, chunkier bars
              sourceNodeRef.current.connect(userAnalyserRef.current);

              workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'recorder-worklet');
              
              workletNodeRef.current.port.onmessage = (event) => {
                if (isMicMuted || !isConnectedRef.current) return;

                const inputData = event.data;
                const pcm16 = floatTo16BitPCM(inputData);
                const base64Data = arrayBufferToBase64(pcm16);

                sessionPromise.then(session => {
                    if (!isConnectedRef.current || !session || connectionIdRef.current !== currentConnectionId) return;
                    
                    try {
                        session.sendRealtimeInput({
                            media: {
                                mimeType: "audio/pcm;rate=16000",
                                data: base64Data
                            }
                        });
                    } catch (err) {
                        if (isConnectedRef.current) console.warn("Socket send error:", err);
                    }
                });
              };

              sourceNodeRef.current.connect(userAnalyserRef.current);
              sourceNodeRef.current.connect(workletNodeRef.current);
              workletNodeRef.current.connect(audioContextRef.current.destination);

            } catch (micError) {
              console.error("Microphone access denied", micError);
              hasErrorRef.current = true;
              setStatus('error');
              setErrorMessage("Microphone access denied");
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!isConnectedRef.current) return;

            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setAiSpeaking(true);
              playAudioChunk(audioData);
            }
            if (message.serverContent?.turnComplete) {
               setTimeout(() => setAiSpeaking(false), 1000);
            }
          },
          onclose: (e) => {
            if (connectionIdRef.current === currentConnectionId) {
                isConnectedRef.current = false;
                if (!hasErrorRef.current) {
                    // Specific check for Referrer Policy error (1008)
                    if (e.code === 1008) {
                        setStatus('error');
                        setErrorMessage("Access Denied: Please check API Key Referrer/Domain restrictions.");
                    } else {
                        setStatus('disconnected');
                    }
                    console.log("Session closed:", e);
                }
            }
          },
          onerror: (err) => {
            if (connectionIdRef.current === currentConnectionId) {
                isConnectedRef.current = false;
                hasErrorRef.current = true;
                console.error("Session Error:", err);
                setStatus('error');
                setErrorMessage("Connection Error");
            }
          }
        }
      });

      const session = await sessionPromise;
      
      if (connectionIdRef.current !== currentConnectionId) {
        session.close();
        return;
      }
      
      sessionRef.current = session;

    } catch (error) {
      if (connectionIdRef.current === currentConnectionId) {
          console.error("Failed to start session", error);
          hasErrorRef.current = true;
          setStatus('error');
          setErrorMessage("Failed to start session");
      }
    }
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContextRef.current || !isConnectedRef.current) return;

    try {
      const audioBytes = base64ToUint8Array(base64Audio);
      const pcmData = new Int16Array(audioBytes.buffer);
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768.0;
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
      audioBuffer.copyToChannel(floatData, 0);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;

      // Ensure analyser belongs to current context (Safeguard against 'different audio context' error)
      if (!aiAnalyserRef.current || aiAnalyserRef.current.context !== audioContextRef.current) {
        aiAnalyserRef.current = audioContextRef.current.createAnalyser();
        aiAnalyserRef.current.fftSize = 64; 
        aiAnalyserRef.current.smoothingTimeConstant = 0.6;
        
        // Fix for low volume: Add a GainNode
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 2.5; // Boost volume by 2.5x
        
        aiAnalyserRef.current.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
      }

      source.connect(aiAnalyserRef.current);
      
      const currentTime = audioContextRef.current.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
      
      audioQueueRef.current.push(source);
      source.onended = () => {
        audioQueueRef.current = audioQueueRef.current.filter(s => s !== source);
        if (audioQueueRef.current.length === 0) {
            setAiSpeaking(false);
        }
      };

    } catch (e) {
      console.error("Error playing audio chunk", e);
    }
  };

  const toggleMic = () => {
    playSfx(audioContextRef.current, 'click');
    setIsMicMuted(!isMicMuted);
  };

  const handleClose = () => {
    connectionIdRef.current++;
    isConnectedRef.current = false;
    playSfx(audioContextRef.current, 'disconnect');
    setTimeout(onClose, 200);
  };

  const handleRetry = () => {
      cleanup();
      setTimeout(() => {
          startSession();
      }, 200);
  };

  if (!isOpen || !figure) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-md transition-opacity" 
            onClick={handleClose}
        ></div>

        {/* Drawer */}
        <div className="relative w-full max-w-md bg-[#1c1917] shadow-2xl h-full border-l border-stone-700 flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-4 bg-stone-900 border-b border-stone-800 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border flex items-center gap-1 transition-colors
                        ${status === 'connected' 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                            : 'bg-stone-700/50 text-stone-400 border-stone-600/50'}
                    `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-red-500 animate-pulse' : 'bg-stone-500'}`}></span>
                        Live
                    </div>
                    <span className="text-stone-400 text-xs uppercase tracking-widest">Samvad</span>
                </div>
                <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full text-stone-400 hover:text-white transition-colors">
                    <Icons.X />
                </button>
            </div>

            {/* Main Visualizer Area */}
            <div className="flex-grow relative flex flex-col items-center justify-center p-8 overflow-hidden bg-gradient-to-b from-[#1c1917] to-black">
                
                {/* AI Voice Visualizer (Glow + Ring) */}
                <div 
                    ref={aiVisualizerRef}
                    className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500 rounded-full blur-[80px] pointer-events-none transition-transform duration-75 ease-linear will-change-transform opacity-0 z-0"
                ></div>
                <div 
                    ref={aiVisualizerRingRef}
                    className="absolute top-1/2 left-1/2 w-80 h-80 border-2 border-orange-400/50 rounded-full pointer-events-none transition-transform duration-100 ease-linear will-change-transform opacity-0 z-0"
                ></div>

                {/* Avatar Container */}
                <div className="relative z-10">
                    <div className={`w-40 h-40 rounded-full border-4 shadow-2xl overflow-hidden relative transition-all duration-300 border-stone-700 shadow-black`}>
                        {figure.imageUrl ? (
                            <img src={imagePath} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-stone-800 flex items-center justify-center text-6xl">👑</div>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center space-y-2 z-10">
                    <h2 className="text-3xl font-bold text-white heading-text text-shadow-lg">{figure.summary.title.split('(')[0]}</h2>
                    <p className="text-stone-400 font-serif italic text-sm">{figure.summary.reign || 'Historical Figure'}</p>
                </div>

                {/* Status Text */}
                <div className="mt-12 h-16 flex flex-col items-center justify-center z-10 w-full px-4">
                    {status === 'connecting' && (
                        <span className="text-orange-400 text-sm animate-pulse font-mono tracking-wider">CONNECTING...</span>
                    )}
                    {status === 'error' && (
                        <>
                            <span className="text-red-400 text-xs font-mono text-center mb-3 bg-red-950/30 px-2 py-1 rounded border border-red-900/50">
                                {errorMessage || "CONNECTION FAILED"}
                            </span>
                            <button onClick={handleRetry} className="text-xs bg-red-900/50 text-red-200 px-4 py-2 rounded-full border border-red-700/50 hover:bg-red-800/50 transition-colors font-bold uppercase tracking-wider">
                                Retry Connection
                            </button>
                        </>
                    )}
                    {status === 'disconnected' && (
                        <>
                            <span className="text-stone-500 text-sm font-mono text-center mb-3">
                                Disconnected
                            </span>
                            <button onClick={handleRetry} className="text-xs bg-stone-800 text-stone-200 px-4 py-2 rounded-full border border-stone-700 hover:bg-stone-700 transition-colors font-bold uppercase tracking-wider">
                                Reconnect
                            </button>
                        </>
                    )}
                    {status === 'connected' && (
                        <div className="flex flex-col items-center gap-2">
                            {aiSpeaking ? (
                                <span className="text-orange-300 text-xs font-bold uppercase tracking-widest animate-pulse">Speaking...</span>
                            ) : (
                                <span className="text-stone-400 text-xs uppercase tracking-widest font-bold">Listening...</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="p-8 bg-stone-900 border-t border-stone-800 relative">
                
                {/* User Mic Visualizer (Canvas) */}
                <div className="absolute top-[-60px] left-0 right-0 h-16 flex items-end justify-center px-4 pointer-events-none">
                    <canvas ref={userCanvasRef} width={300} height={64} className="w-full h-full max-w-[300px]"></canvas>
                </div>

                <div className="flex items-center justify-center gap-4">
                    <button 
                        onClick={toggleMic}
                        disabled={status !== 'connected'}
                        className={`p-4 rounded-full transition-all duration-200 ring-2 ${isMicMuted ? 'bg-stone-800 text-red-400 ring-red-900/30 hover:bg-stone-700' : 'bg-stone-800 text-white hover:bg-stone-700 ring-stone-700'} ${status !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isMicMuted ? "Unmute" : "Mute"}
                    >
                        {isMicMuted ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        )}
                    </button>

                    {/* Gender Toggle */}
                    <div className="flex bg-stone-800 rounded-full p-1 border border-stone-700 shadow-inner">
                        <button 
                            className={`px-4 py-2.5 rounded-full text-[10px] font-bold uppercase transition-all duration-300 flex items-center gap-1 ${voiceGender === 'male' ? 'bg-stone-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-300'}`} 
                            onClick={() => { playSfx(audioContextRef.current, 'click'); setVoiceGender('male'); }}
                        >
                            <span>♂</span> Male
                        </button>
                        <button 
                            className={`px-4 py-2.5 rounded-full text-[10px] font-bold uppercase transition-all duration-300 flex items-center gap-1 ${voiceGender === 'female' ? 'bg-stone-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-300'}`} 
                            onClick={() => { playSfx(audioContextRef.current, 'click'); setVoiceGender('female'); }}
                        >
                            <span>♀</span> Female
                        </button>
                    </div>

                    <button 
                        onClick={handleClose}
                        className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg hover:shadow-red-900/50 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        title="End Call"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
                    </button>
                </div>
                <p className="text-center text-stone-600 text-[10px] mt-6 font-mono opacity-50">
                    AalokGPT Live • {status} • Voice: {voiceGender === 'male' ? 'Fenrir' : 'Kore'}
                </p>
            </div>
        </div>
    </div>
  );
};

export default SamvadChat;
