// Momahjong's "Zen music", moved into the toolbox on 2026-10-28 so every game can play it
// (Music style "Jade Sanctuary"). Same notes as the original (Momahjong's sound.js): soft
// pentatonic triangle plucks, one every 0.3 s step at random, over a slow drone that changes
// every 16 steps. Works like music.js: start(), stop(), schedule(from, to).
import { gain } from './noise.js';

const SCALE = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99];
const BASS = [73.42, 98.0, 110.0, 82.41];
const STEP = 0.3;
// Balanced by offline rendering to sit with the other music (about -20 dB RMS; inside
// Momahjong it played much softer, through a 0.35 bus).
const LEVEL = 3.2;

export class Zen {
    playing = false;
    step = 0;
    melIdx = 3;
    nextAt = 0;

    constructor(ctx, dest) {
        this.ctx = ctx;
        this.out = gain(ctx, 0);
        this.out.connect(dest);
    }

    start() {
        if (this.playing) return;
        this.playing = true;
        const t = this.ctx.currentTime;
        this.nextAt = t + 0.1;
        this.out.gain.cancelScheduledValues(t);
        this.out.gain.setTargetAtTime(LEVEL, t, 0.4);
    }

    stop() {
        if (!this.playing) return;
        this.playing = false;
        this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    }

    schedule(from, to) {
        if (!this.playing) return;
        if (this.nextAt < from) this.nextAt = from + 0.05;
        while (this.nextAt < to) {
            const t = this.nextAt;
            if (this.step % 16 === 0) {
                const bass = BASS[(this.step / 16) % 4];
                this.tone(bass, 4.6, 0.16, t, 0.3, 'sine');
                this.tone(bass * 1.5, 4.6, 0.05, t, 0.5, 'sine');
            }
            if (Math.random() < (this.step % 2 === 0 ? 0.55 : 0.22)) {
                this.melIdx = Math.max(0, Math.min(SCALE.length - 1, this.melIdx + Math.floor(Math.random() * 5) - 2));
                this.tone(SCALE[this.melIdx], 0.9, 0.07, t, 0.01, 'triangle');
            }
            this.nextAt += STEP;
            this.step++;
        }
    }

    tone(freq, dur, vol, t, attack, type) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(this.out);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    }
}
