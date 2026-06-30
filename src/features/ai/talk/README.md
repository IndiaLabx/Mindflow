# AI Talk (Live AI Integration)

This module handles real-time, bidirectional voice conversations using the **Gemini Multimodal Live API** via the `@google/genai` library. This is used to implement features like the "Talk to AI" and "Samvad Chat".

## Core Technical Constraints

If you need to edit or expand this feature in the future, adhere strictly to these operational constraints:

### 1. The `@google/genai` Library
Do not use `fetch` or bare `WebSocket` API objects directly for this integration. The new, stable pattern is to use the official GenAI library with its `live.connect()` abstraction:
```javascript
import { GoogleGenAI, Modality } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: ... });
const session = await ai.live.connect({ ... });
```

### 2. Audio Sample Rates (CRITICAL)
- **Microphone (Input)**: Gemini expects **16kHz**. When creating your `AudioContext` for recording, you MUST specify `sampleRate: 16000`.
- **Speaker (Output)**: Gemini responds with **24kHz**. When constructing the `AudioBuffer` to play the model's voice back, you MUST create a buffer initialized with `sampleRate: 24000`.

### 3. Data Formatting (Float32 vs PCM16)
The Web Audio API strictly uses `Float32Array` containing values ranging between `-1.0` and `1.0`.
Gemini strictly expects and returns Raw Audio containing **16-bit PCM** (Int16) values.

- **Encoding (Mic -> Gemini):** We use `floatTo16BitPCM()` to multiply Float32 values by 0x7FFF (32767) to convert them to Int16 before Base64 encoding.
- **Decoding (Gemini -> Speaker):** We use `base64ToUint8Array` -> `Int16Array`, then divide by `32768.0` to put them back into Float32 so the browser's `AudioBuffer` can play them.

### 4. AudioWorklet vs ScriptProcessorNode
We use an **AudioWorkletProcessor** instead of the deprecated `ScriptProcessorNode`.
However, to avoid issues with serving `.js` files in development/build steps (CORS and path resolving problems), we store the `RecorderProcessor` code directly as a string (`AudioRecorderWorkletCode` in `audio-helpers.ts`), convert it to a `Blob`, and load it via `URL.createObjectURL(blob)`.
*Do not change this to an external `.js` file without ensuring the bundler correctly handles audio worklet worker paths.*

### 5. Seamless Audio Playback
When handling `onmessage` from the server, audio chunks arrive continuously while the model generates text.
We maintain an `audioQueue` and a `nextStartTime` cursor. For every chunk received, we schedule it to play immediately after the previous chunk using `source.start(Math.max(currentTime, nextStartTime))`. This prevents the model from sounding stuttery.

### 6. Component Unmounting
Always implement a rigorous cleanup function. `LiveSession.close()`, `AudioContext.close()`, and `MediaStreamTracks.stop()` must all be fired on unmount to prevent ghost connections consuming bandwidth, memory leaks, and "camera/mic in use" hardware indicators persisting after the user leaves the page.
