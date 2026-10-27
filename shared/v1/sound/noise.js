// Copied from Quiet Words (src/audio/noise.ts) on 2026-10-26 and converted to plain JavaScript.
// Change it here only with care: every game on shared/v1 hears the difference.
// Noise sources and helpers shared by the ambience and music generators.
// Everything takes a BaseAudioContext so it renders the same live or offline (in tests).
const NOISE_SECONDS = 8;
const LOOP_FADE = 0.05;
const cache = new WeakMap();
export function noiseBuffer(ctx, kind) {
    let byKind = cache.get(ctx);
    if (!byKind)
        cache.set(ctx, (byKind = new Map()));
    const hit = byKind.get(kind);
    if (hit)
        return hit;
    const length = Math.floor(ctx.sampleRate * NOISE_SECONDS);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const d = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        if (kind === 'white')
            d[i] = white;
        else if (kind === 'brown') {
            last = (last + 0.02 * white) / 1.02;
            d[i] = last * 3.5;
        }
        else {
            // Paul Kellet's pink noise filter
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.969 * b2 + white * 0.153852;
            b3 = 0.8665 * b3 + white * 0.3104856;
            b4 = 0.55 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.016898;
            d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
    }
    // Blend the tail into the head so looping (with loopEnd set before the tail) has no seam.
    const fade = Math.floor(ctx.sampleRate * LOOP_FADE);
    for (let i = 0; i < fade; i++) {
        const a = i / fade;
        d[i] = d[i] * a + d[length - fade + i] * (1 - a);
    }
    byKind.set(kind, buffer);
    return buffer;
}
// A seamlessly looping noise source, started at a random point so layers never line up.
export function loopNoise(ctx, kind, dest) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, kind);
    src.loop = true;
    src.loopEnd = NOISE_SECONDS - LOOP_FADE;
    src.connect(dest);
    src.start(ctx.currentTime, Math.random() * (NOISE_SECONDS - 1));
    return src;
}
// A short one-shot of white noise (raindrops, fire crackles).
export function burst(ctx, when, dest, duration) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 'white');
    src.connect(dest);
    src.start(when, Math.random() * (NOISE_SECONDS - 1), duration);
}
// Synthetic room: decaying stereo noise, used as the reverb impulse.
export function impulseResponse(ctx, seconds = 3.2, decay = 2.8) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
        const d = buffer.getChannelData(c);
        for (let i = 0; i < length; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
    return buffer;
}
export const rand = (min, max) => min + Math.random() * (max - min);
export const pick = (items) => items[Math.floor(Math.random() * items.length)];
// Gap until the next random event, for events that happen `rate` times a second on average.
export const poissonGap = (rate) => -Math.log(1 - Math.random()) / rate;
export function filter(ctx, type, frequency, Q = 0.7) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    f.Q.value = Q;
    return f;
}
export function gain(ctx, value) {
    const g = ctx.createGain();
    g.gain.value = value;
    return g;
}
export function pan(ctx, value) {
    const p = ctx.createStereoPanner();
    p.pan.value = value;
    return p;
}
// Connects nodes in a line and returns the first, so a source can feed the whole chain.
export function chain(...nodes) {
    for (let i = 0; i < nodes.length - 1; i++)
        nodes[i].connect(nodes[i + 1]);
    return nodes[0];
}
// Midi note number to frequency.
export const mtof = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
