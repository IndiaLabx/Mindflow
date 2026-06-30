export class AudioRecorder {
    private stream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private onDataCallback: ((base64Data: string) => void) | null = null;
    private isRecording = false;

    constructor(onData: (base64Data: string) => void) {
        this.onDataCallback = onData;
    }

    async start() {
        if (this.isRecording) return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } });

            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000,
            });

            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e) => {
                if (!this.isRecording) return;
                const inputData = e.inputBuffer.getChannelData(0);

                // Convert Float32Array to Int16Array
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Convert Int16Array to Base64 in chunks
                let binary = '';
                const bytes = new Uint8Array(pcm16.buffer);
                const len = bytes.byteLength;

                // Chunk to prevent RangeError: Maximum call stack size exceeded in String.fromCharCode.apply
                const CHUNK_SIZE = 8192;
                for (let i = 0; i < len; i += CHUNK_SIZE) {
                    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
                    binary += String.fromCharCode.apply(null, chunk as any);
                }

                const base64 = btoa(binary);

                if (this.onDataCallback) {
                    this.onDataCallback(base64);
                }
            };

            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
            this.isRecording = true;
        } catch (err) {
            console.error('Error starting audio recorder:', err);
            throw err;
        }
    }

    stop() {
        this.isRecording = false;

        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }

        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(console.error);
            this.audioContext = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}
