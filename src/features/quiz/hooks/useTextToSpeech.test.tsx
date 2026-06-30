/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useTextToSpeech } from './useTextToSpeech';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useTextToSpeech', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  data: 'base64audio' // Valid base64 not strictly needed for this test unless we decode it
                }
              }]
            }
          }]
        }),
        text: () => Promise.resolve(''),
      })
    ) as any;

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock Audio
    // Using a class to ensure it is "newable"
    global.Audio = class {
        play = vi.fn().mockResolvedValue(undefined);
        pause = vi.fn();
        addEventListener = vi.fn();
        removeEventListener = vi.fn();
        currentTime = 0;
        src = '';
    } as any;

    // Mock environment variable
    process.env.GOOGLE_AI_KEY = 'test-api-key';

    // Mock atob for base64 decoding if needed (node environment might not have it or it might be different)
    if (!global.atob) {
        global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GOOGLE_AI_KEY;
  });

  it('should call Gemini API with correct payload (no systemInstruction)', async () => {
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('Hello world');
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callArgs = (global.fetch as any).mock.calls[0];
    const url = callArgs[0];
    const options = callArgs[1];
    const body = JSON.parse(options.body);

    // Verify correct model
    expect(url).toContain('gemini-2.5-flash-preview-tts');

    // Verify payload structure
    expect(body).toHaveProperty('contents');
    expect(body.contents[0].parts[0].text).toBe('Hello world');

    // IMPORTANT: Verify systemInstruction is ABSENT
    expect(body).not.toHaveProperty('systemInstruction');

    // Verify voice config
    expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Algenib');
  });

  it('should use the Algenib voice for Hindi compatibility', async () => {
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('नमस्ते');
    });

    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Algenib');
  });
});
