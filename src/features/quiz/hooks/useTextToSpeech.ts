import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook return interface.
 */
interface UseTextToSpeechReturn {
  /** Function to trigger text-to-speech. */
  speak: (text: string) => Promise<void>;
  /** Function to stop playback immediately. */
  stop: () => void;
  /** Whether audio is currently playing. */
  isPlaying: boolean;
  /** Whether the audio is being fetched/generated. */
  isLoading: boolean;
  /** Error message if generation fails. */
  error: string | null;
}

/**
 * Adds a standard WAV header to raw PCM audio data.
 */
function addWavHeader(pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): ArrayBuffer {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const dataLen = pcmData.length;

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataLen, true);

  const wavFile = new Uint8Array(header.byteLength + pcmData.byteLength);
  wavFile.set(new Uint8Array(header), 0);
  wavFile.set(pcmData, header.byteLength);

  return wavFile.buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Module-level cache to store generated audio URLs mapped to text content
const audioCache = new Map<string, string>();

// Quota tracking
const GEMINI_RPM_LIMIT = 2; // Stop at 2 to be safe (Limit is 3)
const GEMINI_RPD_LIMIT = 9; // Stop at 9 to be safe (Limit is 10)
const QUOTA_STORAGE_KEY = 'mindflow_tts_quota';

interface QuotaState {
  date: string; // YYYY-MM-DD
  dailyCount: number;
  minuteTimestamp: number;
  minuteCount: number;
}

function getQuotaState(): QuotaState {
  try {
    const saved = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to parse quota state", e);
  }
  return { date: '', dailyCount: 0, minuteTimestamp: 0, minuteCount: 0 };
}

function saveQuotaState(state: QuotaState) {
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save quota state", e);
  }
}

function checkAndIncrementQuota(): boolean {
  const state = getQuotaState();
  const now = new Date();
  const currentDateString = now.toISOString().split('T')[0];
  const currentTime = now.getTime();

  // Reset daily count if it's a new day
  if (state.date !== currentDateString) {
    state.date = currentDateString;
    state.dailyCount = 0;
    state.minuteCount = 0;
    state.minuteTimestamp = currentTime;
  }

  // Reset minute count if a minute has passed
  if (currentTime - state.minuteTimestamp >= 60000) {
    state.minuteCount = 0;
    state.minuteTimestamp = currentTime;
  }

  // Check limits
  if (state.dailyCount >= GEMINI_RPD_LIMIT || state.minuteCount >= GEMINI_RPM_LIMIT) {
    return false; // Limit reached, do not increment, should fallback
  }

  // Increment
  state.dailyCount++;
  state.minuteCount++;
  saveQuotaState(state);
  return true;
}


/**
 * Custom hook for Text-to-Speech using Google's Gemini Native Audio API
 * with in-memory caching and smart fallback to Native Browser TTS.
 */
export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
    setIsPlaying(false);
  }, []);

  const playNativeTTS = useCallback((text: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log("Using Native Browser TTS fallback");
        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a Hindi voice if possible
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        }

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => {
          setIsPlaying(false);
          resolve();
        };
        utterance.onerror = (e) => {
          console.error("Native TTS Error:", e);
          setIsPlaying(false);
          setError("Native TTS playback failed");
          reject(new Error("Native TTS playback failed"));
        };

        window.speechSynthesis.speak(utterance);
      } catch (err: any) {
        console.error("Failed to initialize Native TTS", err);
        setError("Failed to initialize Native TTS");
        setIsPlaying(false);
        reject(err);
      }
    });
  }, []);

  const speak = useCallback(async (text: string) => {
    stop();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Check Cache
      if (audioCache.has(text)) {
        console.log('Playing TTS from cache');
        const cachedUrl = audioCache.get(text)!;
        const audio = new Audio(cachedUrl);
        audioRef.current = audio;

        audio.onended = () => setIsPlaying(false);
        audio.onerror = (e) => {
          console.error('Cached Audio Playback Error', e);
          setError('Failed to play cached audio');
          setIsPlaying(false);
        };

        setIsLoading(false);
        await audio.play();
        setIsPlaying(true);
        return;
      }

      // 2. Check Quota
      const canUseGemini = checkAndIncrementQuota();
      if (!canUseGemini) {
        console.log('Gemini TTS Quota Limit Reached. Falling back to native TTS.');
        setIsLoading(false);
        await playNativeTTS(text);
        return;
      }

      // 3. Fetch from Gemini
      const apiKey = process.env.GOOGLE_AI_KEY;
      if (!apiKey) {
        console.warn("GOOGLE_AI_KEY is missing. Falling back to native TTS.");
        setIsLoading(false);
        await playNativeTTS(text);
        return;
      }

      console.log('Requesting Gemini Native Audio (Direct) for:', text.substring(0, 20) + '...');
      const model = "gemini-2.5-flash-preview-tts";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Algenib" }
            }
          }
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Audio service error (${response.status})`);
      }

      const data = await response.json();
      const part = data.candidates?.[0]?.content?.parts?.[0];

      if (!part || !part.inlineData) {
        throw new Error("No audio data received.");
      }

      const audioBase64 = part.inlineData.data;
      const binaryString = atob(audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const wavBuffer = addWavHeader(bytes, 24000, 1);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Store in cache
      audioCache.set(text, audioUrl);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onerror = (e) => {
        console.error('Audio Playback Error', e);
        setError('Failed to play audio');
        setIsPlaying(false);
      };

      setIsLoading(false);
      await audio.play();
      setIsPlaying(true);

    } catch (err: any) {
      console.error('Gemini TTS Error, falling back to Native:', err);
      // Fallback on error
      setIsLoading(false);
      try {
        await playNativeTTS(text);
      } catch (fallbackErr) {
        setError(err.message || 'An unexpected error occurred during TTS');
      }
    } finally {
      // Ensure loading state is false if an unhandled exception occurred somehow
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [stop, playNativeTTS, isLoading]);

  return { speak, stop, isPlaying, isLoading, error };
}
