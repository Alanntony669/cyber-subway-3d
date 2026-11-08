// Enhanced Procedural Audio System with Dynamic Ambience & Soundtracks
class SoundFX {
    constructor() {
        this.ctx = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.ambientGain = null;
        this.isMuted = false;
        this.musicPlaying = false;
        this.bpm = 128;
        this.step = 0;
        this.musicTimer = null;
        this.coinStreak = 0;
        this.lastCoinTime = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();

                this.musicGain = this.ctx.createGain();
                this.musicGain.gain.value = 0.24;
                this.musicGain.connect(this.ctx.destination);

                this.sfxGain = this.ctx.createGain();
                this.sfxGain.gain.value = 0.4;
                this.sfxGain.connect(this.ctx.destination);

                this.ambientGain = this.ctx.createGain();
                this.ambientGain.gain.value = 0.12;
                this.ambientGain.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.musicGain) this.musicGain.gain.value = this.isMuted ? 0 : 0.24;
        if (this.sfxGain) this.sfxGain.gain.value = this.isMuted ? 0 : 0.4;
        if (this.ambientGain) this.ambientGain.gain.value = this.isMuted ? 0 : 0.12;
        return this.isMuted;
    }

    // Pitch rises with consecutive coin pickups within 1.2s!
    playCoin() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        if (now - this.lastCoinTime < 1.2) {
            this.coinStreak = Math.min(this.coinStreak + 1, 8);
        } else {
            this.coinStreak = 0;
        }
        this.lastCoinTime = now;

        const baseFreq = 880; // A5
        const semitoneStep = Math.pow(2, (this.coinStreak * 2) / 12);
        const freq1 = baseFreq * semitoneStep;
        const freq2 = freq1 * 1.33; // 4th interval

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq1, now);
        osc.frequency.exponentialRampToValueAtTime(freq2, now + 0.08);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    playJump() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.18);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playSlide() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.24);
        filter.Q.value = 3.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
    }

    playCloseCall() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    playCrash() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Punchy low impact
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(24, now + 0.5);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    playPowerup() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            gain.gain.setValueAtTime(0.3, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.15);
        });
    }

    startMusic() {
        if (this.musicPlaying || !this.ctx) return;
        this.musicPlaying = true;
        this.step = 0;
        const intervalMs = (60 / this.bpm) * 1000 / 4;

        // Modern Driving Synthwave Progression (D Minor / F / C / Bb)
        const bassNotes = [
            146.8, 146.8, 146.8, 220.0, 146.8, 146.8, 174.6, 146.8,
            174.6, 174.6, 261.6, 174.6, 174.6, 174.6, 220.0, 174.6,
            130.8, 130.8, 196.0, 130.8, 130.8, 130.8, 164.8, 130.8,
            116.5, 116.5, 174.6, 116.5, 116.5, 116.5, 146.8, 116.5
        ];

        this.musicTimer = setInterval(() => {
            if (!this.musicPlaying || this.isMuted) return;
            const now = this.ctx.currentTime;

            // Punchy Electronic Kick on 1 and 3
            if (this.step % 4 === 0) {
                const kick = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kick.frequency.setValueAtTime(140, now);
                kick.frequency.exponentialRampToValueAtTime(35, now + 0.09);
                kickGain.gain.setValueAtTime(0.45, now);
                kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
                kick.connect(kickGain);
                kickGain.connect(this.musicGain);
                kick.start(now);
                kick.stop(now + 0.09);
            }

            // Snare / Clap on 2 and 4
            if (this.step % 8 === 4) {
                const snare = this.ctx.createOscillator();
                const snareGain = this.ctx.createGain();
                snare.type = 'triangle';
                snare.frequency.setValueAtTime(260, now);
                snare.frequency.exponentialRampToValueAtTime(90, now + 0.07);
                snareGain.gain.setValueAtTime(0.3, now);
                snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
                snare.connect(snareGain);
                snareGain.connect(this.musicGain);
                snare.start(now);
                snare.stop(now + 0.07);
            }

            // High-hat shimmer on 16ths
            if (this.step % 2 === 1) {
                const hatOsc = this.ctx.createOscillator();
                const hatGain = this.ctx.createGain();
                hatOsc.type = 'square';
                hatOsc.frequency.setValueAtTime(8000 + Math.random() * 2000, now);
                hatGain.gain.setValueAtTime(0.04, now);
                hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                hatOsc.connect(hatGain);
                hatGain.connect(this.musicGain);
                hatOsc.start(now);
                hatOsc.stop(now + 0.03);
            }

            // Synth Bass
            const freq = bassNotes[this.step % bassNotes.length];
            if (freq) {
                const bass = this.ctx.createOscillator();
                const filter = this.ctx.createBiquadFilter();
                const gain = this.ctx.createGain();

                bass.type = 'sawtooth';
                bass.frequency.setValueAtTime(freq / 2, now);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(750, now);
                filter.frequency.exponentialRampToValueAtTime(220, now + 0.12);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);

                bass.connect(filter);
                filter.connect(gain);
                gain.connect(this.musicGain);

                bass.start(now);
                bass.stop(now + 0.13);
            }

            this.step = (this.step + 1) % 64;
        }, intervalMs);
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }
}

window.soundFX = new SoundFX();
