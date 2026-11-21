"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Axes, Chart, TextButton } from "@/components/viz";

import { decibels, FFT_SIZE, magnitudes } from "./audio";
import { hzToMel } from "./spectrogram";
import { AXIS, useSentence } from "./WaveformPlayer";

const WIDTH = 640;
const HEIGHT = 236;
const [LEFT, RIGHT, TOP, BOTTOM] = [44, 624, 18, 174];
const PLOT_W = RIGHT - LEFT;
const PLOT_H = BOTTOM - TOP;

const MAX_HZ = 12000;
const MAX_MEL = hzToMel(MAX_HZ);
const NUM_BINS = 64;
const NUM_BANDS = 12;
const DB_FLOOR = -70;
const DURATION_MS = 16000;

const TICKS_HZ = [0, 500, 1000, 2000, 4000, 6000, 8000, 12000];

const melToHz = (mel: number) => 700 * (10 ** (mel / 2595) - 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
const range = (t: number, start: number, end: number) => ease((t - start) / (end - start));

interface Bin {
  index: number;
  hz: number;
  mag: number;
  level: number;
  primaryBand: number;
}

interface Band {
  index: number;
  lowerHz: number;
  centreHz: number;
  upperHz: number;
  centreMel: number;
  mag: number;
  level: number;
  members: Array<{ bin: Bin; weight: number }>;
}

const STAGES = [
  {
    id: 0,
    label: "1. Linear bins",
    stop: 0.08,
    caption: "64 evenly spaced FFT bins from 0 to 12,000 Hz. Half of them sit above 6,000 Hz.",
  },
  {
    id: 1,
    label: "2. Warp scale",
    stop: 0.37,
    caption:
      "Applying the mel formula stretches low frequencies apart and crushes high ones together — still 64 uneven bins.",
  },
  {
    id: 2,
    label: "3. Triangles",
    stop: 0.65,
    caption:
      "Overlay evenly spaced triangular filters in mel space (12 shown; speech models use 80) to weight the bins beneath each band.",
  },
  {
    id: 3,
    label: "4. Re-bin",
    stop: 0.94,
    caption:
      "Each triangle averages its FFT bins into one value, collapsing 64 uneven bins into 12 evenly spaced mel bands. Hover a band to inspect it.",
  },
] as const;

// Smooth speech-like fallback while the sentence WAV decodes
function syntheticBins(): Float64Array {
  const out = new Float64Array(NUM_BINS);
  for (let i = 0; i < NUM_BINS; i++) {
    const hz = ((i + 0.5) / NUM_BINS) * MAX_HZ;
    const f1 = Math.exp(-(((hz - 340) / 260) ** 2)) * 1.0;
    const f2 = Math.exp(-(((hz - 2250) / 480) ** 2)) * 0.42;
    const f3 = Math.exp(-(((hz - 3150) / 520) ** 2)) * 0.24;
    const f4 = Math.exp(-(((hz - 4400) / 700) ** 2)) * 0.08;
    const hiss = Math.exp(-(((hz - 8600) / 2400) ** 2)) * 0.03;
    const ripple = 0.72 + 0.28 * Math.cos((hz / 170) * 2 * Math.PI);
    out[i] = Math.max(0.002, (f1 + f2 + f3 + f4) * ripple + hiss + 0.004 * Math.exp(-hz / 6000));
  }
  return out;
}

function buildData(sound: { samples: Float32Array; sampleRate: number } | null) {
  let rawMags: Float64Array;
  if (sound) {
    const start = Math.round(2.805 * sound.sampleRate);
    const fft = magnitudes(sound.samples, FFT_SIZE, start, FFT_SIZE);
    const binHz = sound.sampleRate / FFT_SIZE;
    rawMags = new Float64Array(NUM_BINS);
    for (let i = 0; i < NUM_BINS; i++) {
      const lo = Math.floor(((i / NUM_BINS) * MAX_HZ) / binHz);
      const hi = Math.min(fft.length - 1, Math.ceil((((i + 1) / NUM_BINS) * MAX_HZ) / binHz));
      let power = 0;
      let count = 0;
      for (let k = lo; k <= hi; k++) {
        power += fft[k] ** 2;
        count++;
      }
      rawMags[i] = Math.sqrt(power / (count || 1));
    }
  } else {
    rawMags = syntheticBins();
  }

  let peak = 0;
  for (let i = 0; i < NUM_BINS; i++) peak = Math.max(peak, rawMags[i]);

  const step = MAX_MEL / (NUM_BANDS + 1);
  const bandDefs = Array.from({ length: NUM_BANDS }, (_, index) => ({
    index,
    lowerHz: melToHz(index * step),
    centreHz: melToHz((index + 1) * step),
    upperHz: melToHz((index + 2) * step),
    centreMel: (index + 1) * step,
  }));

  const bins: Bin[] = Array.from({ length: NUM_BINS }, (_, index) => {
    const hz = ((index + 0.5) / NUM_BINS) * MAX_HZ;
    const mel = hzToMel(hz);
    let primaryBand = 0;
    let bestDist = Infinity;
    for (const b of bandDefs) {
      const dist = Math.abs(mel - b.centreMel);
      if (dist < bestDist) {
        bestDist = dist;
        primaryBand = b.index;
      }
    }
    const mag = rawMags[index];
    const level = clamp01(1 - decibels(mag, peak) / DB_FLOOR);
    return { index, hz, mag, level, primaryBand };
  });

  const bands: Band[] = bandDefs.map((def) => {
    const members: Array<{ bin: Bin; weight: number }> = [];
    let power = 0;
    let weightSum = 0;
    for (const bin of bins) {
      if (bin.hz > def.lowerHz && bin.hz < def.upperHz) {
        const weight =
          bin.hz < def.centreHz
            ? (bin.hz - def.lowerHz) / (def.centreHz - def.lowerHz)
            : (def.upperHz - bin.hz) / (def.upperHz - def.centreHz);
        if (weight > 0) {
          members.push({ bin, weight });
          power += weight * bin.mag ** 2;
          weightSum += weight;
        }
      }
    }
    const mag = Math.sqrt(power / (weightSum || 1));
    const level = clamp01(1 - decibels(mag, peak) / DB_FLOOR);
    return { ...def, mag, level, members };
  });

  return { bins, bands };
}

function xForHz(hz: number, warp: number) {
  const linear = hz / MAX_HZ;
  const mel = hzToMel(hz) / MAX_MEL;
  return LEFT + (linear + (mel - linear) * warp) * PLOT_W;
}

function yForLevel(level: number) {
  return BOTTOM - level * PLOT_H;
}

function trianglePath(band: Band, warp: number, scaleHeight: number) {
  const pts: string[] = [];
  const segs = 12;
  const peakH = PLOT_H * 0.42 * scaleHeight;
  for (let i = 0; i <= segs; i++) {
    const f = i / segs;
    const hz = band.lowerHz + (band.centreHz - band.lowerHz) * f;
    pts.push(`${i === 0 ? "M" : "L"}${xForHz(hz, warp).toFixed(1)} ${(BOTTOM - f * peakH).toFixed(1)}`);
  }
  for (let i = 1; i <= segs; i++) {
    const f = i / segs;
    const hz = band.centreHz + (band.upperHz - band.centreHz) * f;
    pts.push(`L${xForHz(hz, warp).toFixed(1)} ${(BOTTOM - (1 - f) * peakH).toFixed(1)}`);
  }
  pts.push("Z");
  return pts.join(" ");
}

function formatHz(hz: number) {
  if (hz === 0) return "0";
  if (hz >= 1000) return `${hz / 1000}k`;
  return `${hz}`;
}

export default function MelFilterbankAnimation() {
  const sound = useSentence();
  const { bins, bands } = useMemo(() => buildData(sound), [sound]);

  const containerRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [peekHz, setPeekHz] = useState(false);
  const [peekBlend, setPeekBlend] = useState(0);
  const [hoveredBand, setHoveredBand] = useState<number | null>(null);
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || hasAutoPlayed.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      hasAutoPlayed.current = true;
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAutoPlayed.current) {
          hasAutoPlayed.current = true;
          setPlaying(true);
        }
      },
      { threshold: 0.45 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = 0;
    function tick(now: number) {
      const dt = now - last;
      last = now;
      setProgress((prev) => {
        const next = prev + dt / DURATION_MS;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    const target = peekHz ? 1 : 0;
    if (Math.abs(peekBlend - target) < 0.001) return;
    let last = performance.now();
    let raf = 0;
    function tick(now: number) {
      const dt = Math.min(50, now - last);
      last = now;
      setPeekBlend((prev) => {
        const step = dt / 500;
        const next = target > prev ? Math.min(1, prev + step) : Math.max(0, prev - step);
        if (Math.abs(next - target) > 0.001) raf = requestAnimationFrame(tick);
        return next;
      });
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [peekHz, peekBlend]);

  const rawWarp = range(progress, 0.16, 0.34);
  const warp = rawWarp * (1 - ease(peekBlend));
  const trianglesIn = range(progress, 0.42, 0.51);
  const trianglesDim = 1 - 0.5 * range(progress, 0.78, 0.88);
  const rebin = range(progress, 0.72, 0.86);
  const bracketOpacity = range(progress, 0.03, 0.09) * (1 - range(progress, 0.4, 0.46));

  const activeStage = progress < 0.16 ? 0 : progress < 0.42 ? 1 : progress < 0.72 ? 2 : 3;
  const stage = STAGES[activeStage];

  const autoSpotLow = range(progress, 0.52, 0.56) * (1 - range(progress, 0.69, 0.73));
  const autoSpotHigh = range(progress, 0.59, 0.63) * (1 - range(progress, 0.69, 0.73));

  function bandHighlight(index: number) {
    if (hoveredBand !== null) return hoveredBand === index ? 1 : 0;
    if (index === 1) return autoSpotLow;
    if (index === 10) return autoSpotHigh;
    return 0;
  }

  const melCurvePath = useMemo(
    () =>
      bands
        .map((b, i) => `${i === 0 ? "M" : "L"}${xForHz(b.centreHz, warp).toFixed(1)} ${yForLevel(b.level).toFixed(1)}`)
        .join(" "),
    [bands, warp]
  );

  const lowX0 = xForHz(0, warp);
  const lowX1 = xForHz(2000, warp);
  const highX0 = xForHz(6000, warp);
  const highX1 = xForHz(12000, warp);

  const inspectedBand = hoveredBand !== null ? bands[hoveredBand] : null;

  function handlePlayPause() {
    if (playing) {
      setPlaying(false);
    } else {
      if (progress >= 0.99) setProgress(0);
      setPeekHz(false);
      setPlaying(true);
    }
  }

  return (
    <figure ref={containerRef} className="not-prose mx-0 my-10 font-mallory-book">
      {/* Controls row matching SentencePlayback and shared viz TextButton style */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={handlePlayPause}
          aria-label={playing ? "Pause mel animation" : "Play mel animation"}
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-chart-series-1 text-white hover:opacity-85"
        >
          <svg viewBox="0 0 16 16" className="size-3 fill-current" aria-hidden="true">
            {playing ? <path d="M3 2h3.5v12H3zM9.5 2H13v12h-3.5z" /> : <path d="M4 1.5v13L14 8z" />}
          </svg>
        </button>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {STAGES.map((s) => (
            <TextButton
              key={s.id}
              active={activeStage === s.id}
              onClick={() => {
                setPlaying(false);
                setProgress(s.stop);
              }}
            >
              {s.label}
            </TextButton>
          ))}
        </div>

        {progress >= 0.34 && (
          <div className="ml-auto">
            <TextButton active={peekHz} onClick={() => setPeekHz((v) => !v)}>
              {peekHz ? "Showing in linear Hz" : "Peek in linear Hz"}
            </TextButton>
          </div>
        )}
      </div>

      <Chart
        width={WIDTH}
        height={HEIGHT}
        label="Animation showing 64 linear FFT frequency bins stretching onto the mel scale, overlaid with 12 triangular filters and collapsed into 12 evenly spaced mel bands."
      >
        <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />

        {/* Y-axis ticks */}
        {[0, -20, -40, -60].map((db) => {
          const y = yForLevel(clamp01(1 - db / DB_FLOOR));
          return (
            <text key={db} x={LEFT - 7} y={y + 3} textAnchor="end" className="viz-axis" style={AXIS}>
              {db < 0 ? `−${-db}` : db}
            </text>
          );
        })}
        <text
          x={11}
          y={(TOP + BOTTOM) / 2}
          transform={`rotate(-90 11 ${(TOP + BOTTOM) / 2})`}
          textAnchor="middle"
          className="viz-axis"
          style={AXIS}
        >
          Strength (dB)
        </text>

        {/* Warped X-axis ticks */}
        {TICKS_HZ.map((hz) => {
          const x = xForHz(hz, warp);
          const opacity =
            (hz === 500 ? clamp01(warp * 1.4 - 0.2) : 1) * (hz === 6000 ? 1 - clamp01((warp - 0.7) * 2) * 0.5 : 1);
          return (
            <g key={hz} opacity={opacity}>
              <line x1={x} y1={BOTTOM} x2={x} y2={BOTTOM + 3.5} className="stroke-chart-hairline" strokeWidth={1} />
              <text x={x} y={BOTTOM + 13} textAnchor="middle" className="viz-axis" style={AXIS}>
                {formatHz(hz)}
              </text>
            </g>
          );
        })}
        <text x={(LEFT + RIGHT) / 2} y={BOTTOM + 27} textAnchor="middle" className="viz-axis" style={AXIS}>
          {warp > 0.5 ? "Frequency (Hz, mel scale)" : "Frequency (Hz)"}
        </text>

        {/* Stage 3: 12 overlapping triangular filters */}
        {trianglesIn > 0.005 && (
          <g>
            {bands.map((band) => {
              const hi = bandHighlight(band.index);
              return (
                <path
                  key={band.index}
                  d={trianglePath(band, warp, trianglesIn)}
                  className="cursor-pointer fill-chart-series-2 stroke-chart-series-2"
                  fillOpacity={hi > 0.1 ? 0.05 + hi * 0.12 : 0.03 * trianglesDim}
                  strokeOpacity={hi > 0.1 ? 0.45 + hi * 0.5 : 0.35 * trianglesDim}
                  strokeWidth={hi > 0.1 ? 1.4 : 0.9}
                  onMouseEnter={() => setHoveredBand(band.index)}
                  onMouseLeave={() => setHoveredBand(null)}
                />
              );
            })}
          </g>
        )}

        {/* 64 linear FFT bins */}
        <g>
          {bins.map((bin) => {
            const x = xForHz(bin.hz, warp);
            const y = yForLevel(bin.level);

            let weightGlow = 0;
            for (const band of bands) {
              const hi = bandHighlight(band.index);
              if (hi > 0.05) {
                const found = band.members.find((m) => m.bin.index === bin.index);
                if (found) weightGlow = Math.max(weightGlow, hi * found.weight);
              }
            }

            const baseOpacity = 1 - rebin * 0.85;
            const highlighted = weightGlow > 0.15;
            return (
              <g key={bin.index}>
                <line
                  x1={x}
                  y1={BOTTOM}
                  x2={x}
                  y2={y}
                  className={highlighted ? "stroke-chart-series-2" : "stroke-chart-series-1"}
                  strokeWidth={highlighted ? 1.3 : 0.9}
                  strokeOpacity={Math.max(baseOpacity * 0.65, weightGlow * 0.95)}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={highlighted ? 2.1 + weightGlow * 0.8 : 1.7}
                  className={highlighted ? "fill-chart-series-2" : "fill-chart-series-1"}
                  fillOpacity={Math.max(baseOpacity, weightGlow)}
                />
              </g>
            );
          })}
        </g>

        {/* Stage 4: Bins gliding smoothly into the 12 mel bands */}
        {rebin > 0.01 && rebin < 0.99 && (
          <g>
            {bins.map((bin) => {
              const target = bands[bin.primaryBand];
              const sx = xForHz(bin.hz, warp);
              const sy = yForLevel(bin.level);
              const tx = xForHz(target.centreHz, warp);
              const ty = yForLevel(target.level);
              const px = sx + (tx - sx) * rebin;
              const py = sy + (ty - sy) * rebin - 10 * Math.sin(rebin * Math.PI);
              return (
                <circle
                  key={`m-${bin.index}`}
                  cx={px}
                  cy={py}
                  r={1.7}
                  className="fill-chart-series-2"
                  fillOpacity={Math.sin(rebin * Math.PI) * 0.85}
                />
              );
            })}
          </g>
        )}

        {/* Stage 4: 12 evenly spaced mel bands */}
        {rebin > 0.05 && (
          <g opacity={clamp01((rebin - 0.05) / 0.8)}>
            <path
              d={melCurvePath}
              fill="none"
              className="stroke-chart-series-2"
              strokeWidth={1.25}
              strokeOpacity={0.65}
            />
            {bands.map((band) => {
              const cx = xForHz(band.centreHz, warp);
              const cy = yForLevel(band.level);
              const grownY = BOTTOM - (BOTTOM - cy) * clamp01(rebin * 1.15);
              const hi = bandHighlight(band.index);
              return (
                <g
                  key={`band-${band.index}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredBand(band.index)}
                  onMouseLeave={() => setHoveredBand(null)}
                >
                  <rect
                    x={cx - PLOT_W / (NUM_BANDS * 2.4)}
                    y={TOP}
                    width={PLOT_W / (NUM_BANDS * 1.2)}
                    height={PLOT_H}
                    fill="transparent"
                  />
                  <line
                    x1={cx}
                    y1={BOTTOM}
                    x2={cx}
                    y2={grownY}
                    className="stroke-chart-series-2"
                    strokeWidth={hi > 0.1 ? 3 : 2}
                    strokeOpacity={hi > 0.1 ? 1 : 0.85}
                  />
                  <circle
                    cx={cx}
                    cy={grownY}
                    r={hi > 0.1 ? 4.2 : 3.4}
                    className="fill-chart-series-2 stroke-background"
                    strokeWidth={1.5}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* Stage 3 spotlight count labels */}
        {hoveredBand === null && autoSpotLow > 0.05 && (
          <text
            x={xForHz(bands[1].centreHz, warp)}
            y={BOTTOM - PLOT_H * 0.47}
            textAnchor="middle"
            className="fill-chart-series-2"
            style={AXIS}
            opacity={autoSpotLow}
          >
            {bands[1].members.length} bins → 1
          </text>
        )}
        {hoveredBand === null && autoSpotHigh > 0.05 && (
          <text
            x={xForHz(bands[10].centreHz, warp) - 8}
            y={BOTTOM - PLOT_H * 0.47}
            textAnchor="middle"
            className="fill-chart-series-2"
            style={AXIS}
            opacity={autoSpotHigh}
          >
            {bands[10].members.length} bins → 1
          </text>
        )}

        {/* Stage 1 & 2 sparse vs crowded brackets */}
        {bracketOpacity > 0.01 && (
          <g opacity={bracketOpacity}>
            <path
              d={`M${lowX0 + 2} ${BOTTOM + 36} L${lowX0 + 2} ${BOTTOM + 42} L${lowX1 - 2} ${BOTTOM + 42} L${lowX1 - 2} ${BOTTOM + 36}`}
              fill="none"
              className="stroke-chart-series-1"
              strokeWidth={1}
            />
            <text
              x={(lowX0 + lowX1) / 2}
              y={BOTTOM + 53}
              textAnchor="middle"
              className="fill-chart-series-1"
              style={AXIS}
            >
              {warp > 0.5 ? "0–2 kHz: 11 bins, stretched" : "0–2 kHz: 11 bins"}
            </text>

            <path
              d={`M${highX0 + 2} ${BOTTOM + 36} L${highX0 + 2} ${BOTTOM + 42} L${highX1 - 2} ${BOTTOM + 42} L${highX1 - 2} ${BOTTOM + 36}`}
              fill="none"
              className="stroke-chart-series-2"
              strokeWidth={1}
            />
            <text
              x={(highX0 + highX1) / 2}
              y={BOTTOM + 53}
              textAnchor="middle"
              className="fill-chart-series-2"
              style={AXIS}
            >
              {warp > 0.5 ? "6–12 kHz: 32 bins, crowded" : "6–12 kHz: 32 bins (half)"}
            </text>
          </g>
        )}
      </Chart>

      {/* Hairline scrub slider matching shared viz.tsx */}
      <input
        type="range"
        aria-label="Animation progress"
        min={0}
        max={1}
        step={0.002}
        value={progress}
        onChange={(e) => {
          setPlaying(false);
          setProgress(parseFloat(e.target.value));
        }}
        className="viz-range mt-1"
      />

      {/* Quiet serif caption matching Figure in viz.tsx */}
      <figcaption className="mt-1 font-source-serif text-[14px] leading-normal text-chart-muted italic">
        {inspectedBand
          ? `Band ${inspectedBand.index + 1} (${Math.round(inspectedBand.lowerHz).toLocaleString("en-GB")}–${Math.round(inspectedBand.upperHz).toLocaleString("en-GB")} Hz): weighted average of ${inspectedBand.members.length} FFT ${inspectedBand.members.length === 1 ? "bin" : "bins"} into 1 mel value.`
          : peekHz
            ? "Back in linear Hz: the same 12 filters are narrow at low frequencies and wide at high frequencies."
            : stage.caption}
      </figcaption>
    </figure>
  );
}
