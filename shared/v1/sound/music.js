// Copied from Quiet Words (src/audio/music.ts) on 2026-10-26 and converted to plain JavaScript.
// Change it here only with care: every game on shared/v1 hears the difference.
// Generative ambient music: slow, overlapping pad chords in C major with sparse bell notes
// above them. It wanders between chords at random, so it never repeats.
// If music files are provided (see files.ts) they play instead, crossfading between tracks.
import { filter, gain, mtof, pick, rand } from './noise.js';
// Voicings as midi notes, kept low and open so the pad sits underneath everything.
const CHORDS = {
    I: [48, 55, 62, 64], // C  G  D  E   (C add9)
    vi: [45, 52, 60, 64], // A  E  C  E   (Am)
    IV: [41, 53, 57, 64], // F  F  A  E   (Fmaj7)
    ii: [50, 57, 60, 65], // D  A  C  F   (Dm7)
    V: [43, 55, 62, 64], // G  G  D  E   (G6)
};
// Where each chord tends to go next.
const NEXT = {
    I: ['vi', 'IV', 'ii'],
    vi: ['IV', 'ii', 'I'],
    IV: ['I', 'V', 'vi'],
    ii: ['V', 'IV'],
    V: ['I', 'vi'],
};
// Bell notes: C major pentatonic, so they suit every chord above.
const BELLS = [72, 74, 76, 79, 81];
const ATTACK = 4;
const RELEASE = 5;
const CROSSFADE = 4;
export class Music {
    ctx;
    out;
    playing = false;
    chord = 'I';
    nextChordAt = 0;
    nextBellAt = 0;
    tracks = [];
    trackIndex = 0;
    trackEndsAt = 0;
    constructor(ctx, dest) {
        this.ctx = ctx;
        this.out = gain(ctx, 0);
        this.out.connect(dest);
    }
    useTracks(tracks) {
        this.tracks = tracks;
    }
    start() {
        if (this.playing)
            return;
        this.playing = true;
        const t = this.ctx.currentTime;
        this.nextChordAt = t + 0.2;
        this.nextBellAt = t + rand(3, 6);
        this.trackEndsAt = t;
        this.out.gain.cancelScheduledValues(t);
        this.out.gain.setTargetAtTime(1, t, 1);
    }
    stop() {
        if (!this.playing)
            return;
        this.playing = false;
        this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 1.2);
    }
    schedule(from, to) {
        if (!this.playing)
            return;
        if (this.tracks.length)
            return this.scheduleTracks(to);
        while (this.nextChordAt < to) {
            const duration = rand(11, 15);
            this.pad(Math.max(this.nextChordAt, from), duration);
            this.nextChordAt += duration - ATTACK; // the next chord fades in as this one fades out
            this.chord = pick(NEXT[this.chord]);
        }
        while (this.nextBellAt < to) {
            const t = Math.max(this.nextBellAt, from);
            // Usually a single note, sometimes a short falling or rising phrase.
            const phrase = Math.random() < 0.3 ? 3 : Math.random() < 0.4 ? 2 : 1;
            let note = pick(BELLS);
            for (let k = 0; k < phrase; k++) {
                this.bell(mtof(note), t + k * rand(0.6, 0.9));
                note = BELLS[Math.max(0, Math.min(BELLS.length - 1, BELLS.indexOf(note) + pick([-1, 1])))];
            }
            this.nextBellAt = t + rand(3, 8);
        }
    }
    pad(when, duration) {
        const tone = filter(this.ctx, 'lowpass', rand(650, 950));
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0, when);
        env.gain.linearRampToValueAtTime(0.09, when + ATTACK);
        env.gain.setValueAtTime(0.09, when + duration - RELEASE);
        env.gain.linearRampToValueAtTime(0, when + duration);
        tone.connect(env).connect(this.out);
        CHORDS[this.chord].forEach((midi, i) => {
            // The lowest note is a plain sine; the rest are two slightly detuned triangles for warmth.
            const waves = i === 0 ? [['sine', 0]] : [['triangle', -5], ['triangle', 5]];
            for (const [type, cents] of waves) {
                const osc = this.ctx.createOscillator();
                osc.type = type;
                osc.frequency.value = mtof(midi);
                osc.detune.value = cents;
                osc.connect(tone);
                osc.start(when);
                osc.stop(when + duration + 0.1);
            }
        });
    }
    bell(freq, when) {
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0, when);
        env.gain.linearRampToValueAtTime(0.07, when + 0.01);
        env.gain.exponentialRampToValueAtTime(0.0001, when + 3);
        env.connect(this.out);
        for (const [ratio, level] of [[1, 1], [2, 0.3], [3, 0.08]]) {
            const osc = this.ctx.createOscillator();
            osc.frequency.value = freq * ratio;
            const g = gain(this.ctx, level);
            osc.connect(g).connect(env);
            osc.start(when);
            osc.stop(when + 3.1);
        }
    }
    scheduleTracks(to) {
        while (this.trackEndsAt - CROSSFADE < to) {
            const buffer = this.tracks[this.trackIndex++ % this.tracks.length];
            const when = Math.max(this.ctx.currentTime, this.trackEndsAt - CROSSFADE);
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            const env = this.ctx.createGain();
            env.gain.setValueAtTime(0, when);
            env.gain.linearRampToValueAtTime(1, when + CROSSFADE);
            env.gain.setValueAtTime(1, when + buffer.duration - CROSSFADE);
            env.gain.linearRampToValueAtTime(0, when + buffer.duration);
            src.connect(env).connect(this.out);
            src.start(when);
            this.trackEndsAt = when + buffer.duration;
        }
    }
}
