import { useState, useEffect } from 'react';

// Define limits based on user specs
export const MODEL_CONFIGS = {
  'gemini-3.1-flash-lite-preview': {
    id: 'gemini-3.1-flash-lite-preview',
    displayName: 'Fast 3x',
    rpm: 15,
    tpm: 250000,
    rpd: 500
  },
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    displayName: 'Fast 2x',
    rpm: 10,
    tpm: 250000,
    rpd: 20
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    displayName: 'Fast',
    rpm: 5,
    tpm: 250000,
    rpd: 20
  },
  'gemini-3-flash-preview': {
    id: 'gemini-3-flash-preview',
    displayName: 'Pro model',
    rpm: 5,
    tpm: 250000,
    rpd: 20
  }
};

export type ModelId = keyof typeof MODEL_CONFIGS;

interface QuotaState {
  requestsToday: number;
  requestsLastMinute: number[];
  tokensLastMinute: number[];
  lastResetDate: string;
}

const getInitialQuota = (modelId: string): QuotaState => {
  const today = new Date().toDateString();
  const saved = localStorage.getItem(`mindflow_quota_${modelId}`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.lastResetDate !== today) {
        return { requestsToday: 0, requestsLastMinute: [], tokensLastMinute: [], lastResetDate: today };
      }
      return parsed;
    } catch (e) {
      return { requestsToday: 0, requestsLastMinute: [], tokensLastMinute: [], lastResetDate: today };
    }
  }
  return { requestsToday: 0, requestsLastMinute: [], tokensLastMinute: [], lastResetDate: today };
};

export const useQuota = (modelId: ModelId) => {
  const [quota, setQuota] = useState<QuotaState>(() => getInitialQuota(modelId));
  const config = MODEL_CONFIGS[modelId];

  useEffect(() => {
    const today = new Date().toDateString();
    if (quota.lastResetDate !== today) {
      setQuota({ requestsToday: 0, requestsLastMinute: [], tokensLastMinute: [], lastResetDate: today });
    }
    localStorage.setItem(`mindflow_quota_${modelId}`, JSON.stringify(quota));
  }, [quota, modelId]);

  // Clean up old timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const oneMinAgo = now - 60000;
      setQuota(prev => {
        const filteredReqs = prev.requestsLastMinute.filter(t => t > oneMinAgo);
        const filteredToks = prev.tokensLastMinute.filter(t => t > oneMinAgo); // Just storing timestamps of token usage for simplicity, accurate token counting requires API response
        if (filteredReqs.length !== prev.requestsLastMinute.length || filteredToks.length !== prev.tokensLastMinute.length) {
          return { ...prev, requestsLastMinute: filteredReqs, tokensLastMinute: filteredToks };
        }
        return prev;
      });
    }, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const checkCanRequest = (estimatedTokens: number = 1000) => {
    const now = Date.now();
    const oneMinAgo = now - 60000;

    // Stop 1 step before limit
    const currentRpm = quota.requestsLastMinute.filter(t => t > oneMinAgo).length;

    if (currentRpm >= (config.rpm - 1)) {
        return { allowed: false, reason: "You are speaking too fast. Please wait a minute." };
    }
    if (quota.requestsToday >= (config.rpd - 1)) {
        return { allowed: false, reason: `Daily limit reached for ${config.displayName}. Please switch models.` };
    }

    return { allowed: true };
  };

  const trackRequest = (estimatedTokens: number = 1000) => {
    setQuota(prev => ({
      ...prev,
      requestsToday: prev.requestsToday + 1,
      requestsLastMinute: [...prev.requestsLastMinute, Date.now()],
      tokensLastMinute: [...prev.tokensLastMinute, Date.now()]
    }));
  };

  const getRemainingUses = () => {
    return Math.max(0, config.rpd - quota.requestsToday);
  };

  return { checkCanRequest, trackRequest, getRemainingUses, config };
};
