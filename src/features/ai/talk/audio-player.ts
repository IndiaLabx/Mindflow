export class AudioPlayer {
    private audioContext: AudioContext | null = null;
    private nextStartTime = 0;
    private isPlaying = false;
    private audioQueue: AudioBufferSourceNode[] = [];

    constructor() {
        // We will initialize AudioContext on user interaction (e.g. "Connect" click)
    }

    async init() {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000, // Gemini Multimodal Live API returns 24kHz audio
            });
            this.nextStartTime = this.audioContext.currentTime;
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    play(base64Data: string) {
        if (!this.audioContext) return;

        const arrayBuffer = this.base64ToArrayBuffer(base64Data);
        // The API sends 16-bit PCM. We need to convert it to Float32.
        const int16Array = new Int16Array(arrayBuffer);
        const float32Array = new Float32Array(int16Array.length);

        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 0x7FFF;
        }

        const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);

        const currentTime = this.audioContext.currentTime;

        // Ensure seamless playback by queuing back-to-back
        if (this.nextStartTime < currentTime) {
            this.nextStartTime = currentTime;
        }

        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;

        this.audioQueue.push(source);

        source.onended = () => {
            this.audioQueue = this.audioQueue.filter(s => s !== source);
            if (this.audioQueue.length === 0) {
                // Done playing this chunk sequence
            }
        };
    }

    stop() {
        this.audioQueue.forEach(source => {
            try { source.stop(); } catch (e) { /* ignore already stopped */ }
        });
        this.audioQueue = [];
        this.nextStartTime = this.audioContext?.currentTime || 0;
    }

    close() {
        this.stop();
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
