// Copied from Quiet Words (src/audio/ambience.ts) on 2026-10-26 and converted to plain JavaScript.
// Change it here only with care: every game on shared/v1 hears the difference.
// Procedural nature sounds. Each layer is a steady bed of shaped noise plus small random
// events (drops, crackles, chirps) scheduled a little ahead of time, so it never loops audibly.
import { burst, chain, filter, gain, loopNoise, pan, pick, poissonGap, rand } from './noise.js';
export const LAYERS = ['rain', 'creek', 'waves', 'wind', 'crickets', 'fire', 'birds'];
export const LAYER_LABELS = {
    rain: 'Rain',
    creek: 'Creek',
    waves: 'Waves',
    wind: 'Wind',
    crickets: 'Crickets',
    fire: 'Campfire',
    birds: 'Birdsong',
};
// Evens out loudness so every layer at the same slider position sounds about as loud
// (about -18 dB RMS each). Measured with e2e/audio.spec.ts, which renders every layer and
// prints its level. Crickets sit lower because the ear is most sensitive at their pitch;
// birds are set by their peaks, since they're mostly silence between calls.
const TRIM = { rain: 1.6, creek: 2.1, waves: 1.15, wind: 1.7, crickets: 1.4, fire: 1.4, birds: 1.2 };
// Advances a per-layer clock through the window, calling `event` at each step.
function every(start, gap, event) {
    let next = start;
    return (from, to) => {
        next = Math.max(next, from);
        while (next < to) {
            event(next);
            next += gap();
        }
    };
}
// A sharp attack and quick exponential fade, for drops, crackles and chirps.
function envelope(ctx, when, peak, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    return g;
}
const rain = (ctx, out) => {
    const bed = loopNoise(ctx, 'pink', chain(filter(ctx, 'highpass', 400), filter(ctx, 'lowpass', 5500), gain(ctx, 0.6), out));
    // Individual drops: tiny pitched ticks scattered across the stereo field.
    const schedule = every(ctx.currentTime, () => poissonGap(18), (t) => {
        const decay = rand(0.02, 0.06);
        burst(ctx, t, chain(filter(ctx, 'bandpass', rand(2000, 7000), 6), envelope(ctx, t, rand(0.05, 0.25), decay), pan(ctx, rand(-0.8, 0.8)), out), decay + 0.02);
    });
    return { sources: [bed], schedule };
};
const creek = (ctx, out) => {
    const input = gain(ctx, 1);
    const src = loopNoise(ctx, 'pink', input);
    // Three narrow bands that wander independently give the babbling quality of moving water.
    const bands = [
        { freq: 500, q: 2, level: 0.55 },
        { freq: 1100, q: 3, level: 0.5 },
        { freq: 2300, q: 4, level: 0.35 },
    ].map((b) => {
        const f = filter(ctx, 'bandpass', b.freq, b.q);
        const g = gain(ctx, b.level);
        input.connect(f).connect(g).connect(out);
        return { ...b, f, g };
    });
    const rumble = loopNoise(ctx, 'brown', chain(filter(ctx, 'lowpass', 300), gain(ctx, 0.25), out));
    const schedule = every(ctx.currentTime, () => rand(0.12, 0.35), (t) => {
        for (const b of bands) {
            b.f.frequency.setTargetAtTime(b.freq * rand(0.75, 1.3), t, 0.12);
            b.g.gain.setTargetAtTime(b.level * rand(0.35, 1.4), t, 0.1);
        }
    });
    return { sources: [src, rumble], schedule };
};
const waves = (ctx, out) => {
    const lp = filter(ctx, 'lowpass', 300);
    const body = gain(ctx, 0.06);
    const fizz = gain(ctx, 0);
    const surf = loopNoise(ctx, 'brown', chain(lp, body, out));
    const foam = loopNoise(ctx, 'pink', chain(filter(ctx, 'highpass', 2500), fizz, out));
    // Each wave swells, breaks with a little foam, and draws back.
    const schedule = every(ctx.currentTime, () => rand(7, 11), (t) => {
        const duration = rand(7, 11);
        const rise = duration * 0.4;
        const peak = rand(0.5, 0.9);
        body.gain.setTargetAtTime(peak, t, rise / 3);
        body.gain.setTargetAtTime(0.06, t + rise, (duration - rise) / 3);
        lp.frequency.setTargetAtTime(rand(1000, 1600), t, rise / 3);
        lp.frequency.setTargetAtTime(280, t + rise, (duration - rise) / 3);
        fizz.gain.setTargetAtTime(peak * 0.25, t + rise * 0.85, 0.4);
        fizz.gain.setTargetAtTime(0, t + rise * 1.1, 1.2);
    });
    return { sources: [surf, foam], schedule };
};
const wind = (ctx, out) => {
    const band = filter(ctx, 'bandpass', 400, 0.9);
    const level = gain(ctx, 0.5);
    const whistleBand = filter(ctx, 'bandpass', 1800, 6);
    const whistle = gain(ctx, 0.04);
    const body = loopNoise(ctx, 'brown', chain(band, level, out));
    const high = loopNoise(ctx, 'pink', chain(whistleBand, whistle, out));
    const schedule = every(ctx.currentTime, () => rand(2.5, 6), (t) => {
        level.gain.setTargetAtTime(rand(0.25, 0.9), t, rand(1, 2.5));
        band.frequency.setTargetAtTime(rand(250, 650), t, 2);
        whistle.gain.setTargetAtTime(rand(0, 0.06), t, 2);
        whistleBand.frequency.setTargetAtTime(rand(1400, 2400), t, 2);
    });
    return { sources: [body, high], schedule };
};
const crickets = (ctx, out) => {
    // A few crickets at slightly different pitches and tempos, each pulsing a pure tone.
    const voices = [0, 1, 2].map(() => {
        const osc = ctx.createOscillator();
        osc.frequency.value = rand(4300, 5200);
        const am = gain(ctx, 0);
        osc.connect(am).connect(pan(ctx, rand(-0.7, 0.7))).connect(out);
        osc.start(ctx.currentTime);
        const pulses = pick([2, 3, 4]);
        const amp = rand(0.2, 0.4);
        const tempo = rand(0.55, 0.9);
        const schedule = every(ctx.currentTime + rand(0, 1), () => (Math.random() < 0.08 ? rand(2, 5) : tempo * rand(0.92, 1.08)), (t) => {
            for (let k = 0; k < pulses; k++) {
                const p = t + k * 0.04;
                am.gain.setValueAtTime(0, p);
                am.gain.linearRampToValueAtTime(amp, p + 0.005);
                am.gain.linearRampToValueAtTime(0, p + 0.02);
            }
        });
        return { osc, schedule };
    });
    return {
        sources: voices.map((v) => v.osc),
        schedule: (from, to) => voices.forEach((v) => v.schedule(from, to)),
    };
};
const fire = (ctx, out) => {
    const glow = gain(ctx, 0.45);
    const rumble = loopNoise(ctx, 'brown', chain(filter(ctx, 'lowpass', 350), glow, out));
    const crackle = (t, peak, decay, f) => {
        burst(ctx, t, chain(f, envelope(ctx, t, peak, decay), pan(ctx, rand(-0.6, 0.6)), out), decay + 0.01);
    };
    const flicker = every(ctx.currentTime, () => rand(0.2, 0.6), (t) => glow.gain.setTargetAtTime(rand(0.3, 0.6), t, 0.2));
    // Crackles come in little clusters, with the occasional deeper pop.
    const sparks = every(ctx.currentTime, () => poissonGap(5.5), (t) => {
        const n = 1 + Math.floor(Math.random() * 4);
        for (let k = 0; k < n; k++)
            crackle(t + k * rand(0.005, 0.03), rand(0.06, 0.35), rand(0.003, 0.015), filter(ctx, 'highpass', rand(1000, 3500)));
        if (Math.random() < 0.05)
            crackle(t, 0.35, 0.04, filter(ctx, 'bandpass', 600, 2));
    });
    return {
        sources: [rumble],
        schedule: (from, to) => {
            flicker(from, to);
            sparks(from, to);
        },
    };
};
const birds = (ctx, out) => {
    const air = filter(ctx, 'lowpass', 7000);
    air.connect(out);
    const note = (t, duration, f0, f1, amp, dest) => {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(f0, t);
        osc.frequency.exponentialRampToValueAtTime(f1, t + duration);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(amp, t + 0.01);
        g.gain.linearRampToValueAtTime(amp * 0.7, t + duration * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(g).connect(dest);
        osc.start(t);
        osc.stop(t + duration + 0.02);
    };
    // Three simple "species": a slow two-note whistle, a run of falling chirps, a fast trill.
    const schedule = every(ctx.currentTime + rand(0.5, 2), () => rand(3, 9), (t) => {
        const where = pan(ctx, rand(-0.8, 0.8));
        where.connect(air);
        const amp = rand(0.25, 0.5);
        const species = pick(['whistle', 'chirps', 'trill']);
        if (species === 'whistle') {
            const f = rand(2200, 3200);
            for (let k = 0, at = t; k < pick([2, 3]); k++) {
                const d = rand(0.25, 0.4);
                note(at, d, f * rand(0.95, 1.05), f * rand(0.85, 1.2), amp, where);
                at += d + 0.1;
            }
        }
        else if (species === 'chirps') {
            for (let k = 0, at = t; k < 3 + Math.floor(Math.random() * 4); k++) {
                const d = rand(0.05, 0.09);
                const f0 = rand(3500, 5000);
                note(at, d, f0, f0 * 0.6, amp * 0.8, where);
                at += d + rand(0.06, 0.12);
            }
        }
        else {
            const f = rand(4000, 5500);
            for (let k = 0; k < 8 + Math.floor(Math.random() * 7); k++)
                note(t + k * 0.045, 0.03, f, f * 0.97, amp * 0.6, where);
        }
    });
    return { sources: [], schedule };
};
const builders = { rain, creek, waves, wind, crickets, fire, birds };
// Builds one layer, silent until its `out` gain is raised.
export function createLayer(ctx, name, dest) {
    const out = gain(ctx, 0);
    const trim = gain(ctx, TRIM[name]);
    trim.connect(out).connect(dest);
    const built = builders[name](ctx, trim);
    return {
        out,
        schedule: (from, to) => built.schedule?.(from, to),
        stop: () => {
            built.sources.forEach((s) => s.stop());
            out.disconnect();
        },
    };
}
