// Copied from Quiet Words (src/audio/notes.ts) on 2026-10-26 and converted to plain JavaScript.
// Change it here only with care: every game on shared/v1 hears the difference.
import { mtof } from './noise.js';
// C major pentatonic from G4 upward, the same key as the music, so any swipe is in tune.
const SCALE = [67, 69, 72, 74, 76, 79, 81, 84, 86, 88].map(mtof);
const C5 = mtof(72), E5 = mtof(76), G5 = mtof(79), C6 = mtof(84), E6 = mtof(88), G6 = mtof(91), C7 = mtof(96);
const G4 = mtof(67);
// Synthesised marimba: a sine fundamental, the bar's characteristic overtone near 4x,
// and a very short high partial for the soft knock of the mallet.
export class Notes {
    ctx;
    out;
    constructor(ctx, out) {
        this.ctx = ctx;
        this.out = out;
    }
    partial(freq, when, peak, decay) {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0, when);
        env.gain.linearRampToValueAtTime(peak, when + 0.004);
        env.gain.exponentialRampToValueAtTime(0.0001, when + decay);
        osc.connect(env).connect(this.out);
        osc.start(when);
        osc.stop(when + decay + 0.05);
    }
    strike(freq, when, velocity, decay = 1.1) {
        const v = velocity * (0.9 + Math.random() * 0.2); // no two taps quite the same
        this.partial(freq, when, v, decay);
        this.partial(freq * 3.93, when, v * 0.2, decay * 0.18);
        this.partial(freq * 9.2, when, v * 0.04, 0.035);
    }
    get now() {
        return this.ctx.currentTime + 0.005;
    }
    arpeggio(freqs, gap, velocity, decay) {
        const t = this.now;
        freqs.forEach((f, i) => this.strike(f, t + i * gap, velocity, decay));
    }
    // Each letter added to the trace climbs one step up the scale.
    letter(index) {
        this.strike(SCALE[Math.min(index, SCALE.length - 1)], this.now, 0.42);
    }
    // A word lands in the grid: a soft, gently strummed major chord.
    word() {
        this.arpeggio([C5, E5, G5, C6], 0.035, 0.26, 1.7);
    }
    bonus() {
        this.arpeggio([E6, G6, C7], 0.06, 0.15, 0.9);
    }
    repeat() {
        this.strike(G4, this.now, 0.18, 0.7);
    }
    reveal() {
        this.strike(E6, this.now, 0.14, 0.8);
    }
    levelComplete() {
        this.arpeggio([C5, E5, G5, C6, E6], 0.13, 0.24, 2.4);
    }
}
