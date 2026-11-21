"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Axes, Chart, Controls, Figure, Slider, TextButton, toPath } from "@/components/viz";

import { encodeWav, FFT_SIZE, hannWindow, HOP, ifftFrame, istft, stft, stftMagnitudes, withRandomPhase } from "./stft";

const SRC = "/media/research/AI/audio/representing-audio-data/kokoro-sentence.wav";
// Show 7 consecutive STFT frames centred over the steady "i" in "times" (~2.79 s)
const FIRST_FRAME = 260; // offset = 260 * 256 - 512 = 66,048 (~2.752 s)
const NUM_FRAMES = 7;
const VIEW_START = FIRST_FRAME * HOP - FFT_SIZE / 2;
const VIEW_SAMPLES = (NUM_FRAMES - 1) * HOP + FFT_SIZE; // 2,560 samples (~106.7 ms)
// Interior span where all 4 overlapping Hann windows are present once every frame is added
const FULL_OVERLAP_START = 3 * HOP;
const FULL_OVERLAP_END = (NUM_FRAMES - 1) * HOP;

const [LEFT, RIGHT, TOP, BOTTOM] = [50, 624, 10, 128];
const MID = (TOP + BOTTOM) / 2;
const AMP = MID - TOP - 6;
const LIMIT = 4200; // 16-bit amplitude range
const AXIS = { fontSize: 8.5 };
// Sum of squared Hann windows across 4 quarter-window hops is a flat constant (1.5)
const OVERLAP_NORM = 1.5;

type Mode = "exact" | "random";
type AudioChoice = "reconstructed" | "original";

function toChartX(sampleOffset: number) {
  return LEFT + (sampleOffset / (VIEW_SAMPLES - 1)) * (RIGHT - LEFT);
}

function toChartY(sample: number) {
  return MID - ((sample * 32768) / LIMIT) * AMP;
}

export default function StftReconstruction() {
  const [sound, setSound] = useState<{ samples: Float32Array; sampleRate: number } | null>(null);
  const [mode, setMode] = useState<Mode>("exact");
  const [frameCount, setFrameCount] = useState<number>(NUM_FRAMES);
  const [animating, setAnimating] = useState(false);
  const [audioChoice, setAudioChoice] = useState<AudioChoice>("reconstructed");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let live = true;
    fetch(SRC)
      .then((r) => r.arrayBuffer())
      .then((data) => new OfflineAudioContext(1, 1, 24000).decodeAudioData(data))
      .then((buffer) => {
        if (live) setSound({ samples: buffer.getChannelData(0), sampleRate: buffer.sampleRate });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  // Step through frames 1 -> NUM_FRAMES when animating
  useEffect(() => {
    if (!animating) return;
    const id = window.setInterval(() => {
      setFrameCount((prev) => {
        if (prev >= NUM_FRAMES) {
          setAnimating(false);
          return NUM_FRAMES;
        }
        return prev + 1;
      });
    }, 650);
    return () => window.clearInterval(id);
  }, [animating]);

  // Compute STFT, exact iSTFT, random-phase iSTFT, and the 7 local slices for both modes
  const data = useMemo(() => {
    if (!sound) return null;
    const complexExact = stft(sound.samples);
    const complexRandom = withRandomPhase(stftMagnitudes(complexExact), 42);
    const fullExact = istft(complexExact);
    const fullRandom = istft(complexRandom);

    let maxErr = 0;
    for (let i = 0; i < sound.samples.length; i++) {
      maxErr = Math.max(maxErr, Math.abs(sound.samples[i] - fullExact[i]));
    }

    const extractSlices = (c: typeof complexExact) =>
      Array.from({ length: NUM_FRAMES }, (_, k) => ifftFrame(c.real[FIRST_FRAME + k], c.imag[FIRST_FRAME + k]));

    return {
      exactSlices: extractSlices(complexExact),
      randomSlices: extractSlices(complexRandom),
      fullExact,
      fullRandom,
      maxErr,
      duration: sound.samples.length / sound.sampleRate,
    };
  }, [sound]);

  const urls = useMemo(() => {
    if (!sound || !data) return null;
    return {
      exact: URL.createObjectURL(new Blob([encodeWav(data.fullExact, sound.sampleRate)], { type: "audio/wav" })),
      random: URL.createObjectURL(new Blob([encodeWav(data.fullRandom, sound.sampleRate)], { type: "audio/wav" })),
    };
  }, [sound, data]);

  useEffect(() => {
    return () => {
      if (urls) {
        URL.revokeObjectURL(urls.exact);
        URL.revokeObjectURL(urls.random);
      }
    };
  }, [urls]);

  useEffect(() => {
    if (!playing) return;
    let frame = requestAnimationFrame(tick);
    function tick() {
      setTime(audioRef.current?.currentTime ?? 0);
      frame = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const slices = data ? (mode === "exact" ? data.exactSlices : data.randomSlices) : null;

  // Build paths for individual iFFT slices and their cumulative overlap-add sum
  const { originalPath, slicePaths, activeEnvelopePath, sumPath } = useMemo(() => {
    if (!sound || !slices) {
      return { originalPath: "", slicePaths: [] as string[], activeEnvelopePath: "", sumPath: "" };
    }

    // Subsample by 2 for crisp SVG paths across 2,560 samples
    const origPts: [number, number][] = [];
    for (let i = 0; i < VIEW_SAMPLES; i += 2) {
      origPts.push([toChartX(i), toChartY(sound.samples[VIEW_START + i] ?? 0)]);
    }

    const builtSlicePaths = slices.slice(0, frameCount).map((slice, k) => {
      const start = k * HOP;
      const pts: [number, number][] = [];
      for (let i = 0; i < FFT_SIZE; i += 2) {
        pts.push([toChartX(start + i), toChartY(slice[i] / OVERLAP_NORM)]);
      }
      return toPath(pts);
    });

    // Subtle Hann² envelope outline for the most recently added slice
    const newestStart = (frameCount - 1) * HOP;
    const envPts: [number, number][] = [];
    for (let i = 0; i < FFT_SIZE; i += 8) {
      const w2 = (hannWindow[i] * hannWindow[i]) / OVERLAP_NORM;
      envPts.push([toChartX(newestStart + i), MID - w2 * AMP * 0.92]);
    }

    // Running overlap-add sum divided by the constant 4-window norm (1.5)
    const acc = new Float64Array(VIEW_SAMPLES);
    for (let k = 0; k < frameCount; k++) {
      const slice = slices[k];
      const start = k * HOP;
      for (let i = 0; i < FFT_SIZE; i++) acc[start + i] += slice[i];
    }
    const sumPts: [number, number][] = [];
    for (let i = 0; i < VIEW_SAMPLES; i += 2) {
      sumPts.push([toChartX(i), toChartY(acc[i] / OVERLAP_NORM)]);
    }

    return {
      originalPath: toPath(origPts),
      slicePaths: builtSlicePaths,
      activeEnvelopePath: toPath(envPts),
      sumPath: toPath(sumPts),
    };
  }, [sound, slices, frameCount]);

  function resetAudio(resume: boolean) {
    setPlaying(false);
    setTime(0);
    if (resume) {
      requestAnimationFrame(() => {
        audioRef.current?.play().catch(() => {});
      });
    }
  }

  function switchMode(next: Mode) {
    const wasPlaying = audioRef.current ? !audioRef.current.paused : false;
    setMode(next);
    setAudioChoice("reconstructed");
    resetAudio(wasPlaying);
  }

  function toggleOriginal() {
    const wasPlaying = audioRef.current ? !audioRef.current.paused : false;
    setAudioChoice((prev) => (prev === "original" ? "reconstructed" : "original"));
    resetAudio(wasPlaying);
  }

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  function triggerAnimate() {
    if (animating) {
      setAnimating(false);
      return;
    }
    setFrameCount(1);
    setAnimating(true);
  }

  const audioSrc = audioChoice === "original" ? SRC : urls ? urls[mode] : SRC;
  const duration = data?.duration ?? 0;
  const viewMs = sound ? (VIEW_SAMPLES / sound.sampleRate) * 1000 : 106.7;

  return (
    <Figure
      caption={
        mode === "exact"
          ? `Each STFT column is inverted back into a 43 ms tapered slice (top) and added 10.7 ms after the previous one (bottom). Wherever four slices overlap (shaded band), the sum snaps onto the original recording in grey (full-sentence max error ${data ? data.maxErr.toExponential(1) : "—"}).`
          : "Same spectrogram magnitudes, random phase. Each slice still has the right frequencies, but the peaks no longer line up where slices overlap — so adding them together cancels and smears the wave, turning the sentence into harsh static."
      }
    >
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={(e) => {
          setPlaying(false);
          setTime(e.currentTarget.currentTime);
        }}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
      />

      {/* Audio playback bar for the full sentence */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause audio" : "Play audio"}
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-chart-series-1 text-white hover:opacity-85"
        >
          <svg viewBox="0 0 16 16" className="size-3 fill-current" aria-hidden="true">
            {playing ? <path d="M3 2h3.5v12H3zM9.5 2H13v12h-3.5z" /> : <path d="M4 1.5v13L14 8z" />}
          </svg>
        </button>
        <span className="min-w-0 flex-1 font-mallory-book text-xs text-chart-ink">
          {audioChoice === "original"
            ? "Playing: original sentence"
            : mode === "exact"
              ? "Playing: STFT → iSTFT (with phase)"
              : "Playing: STFT → iSTFT (random phase)"}
        </span>
        <TextButton active={audioChoice === "original"} onClick={toggleOriginal}>
          {audioChoice === "original" ? "Back to reconstructed" : "Compare original"}
        </TextButton>
        <span className="shrink-0 font-mallory-book text-xs text-chart-muted tabular-nums">
          {time.toFixed(2)} / {duration.toFixed(2)} s
        </span>
      </div>

      {/* Top chart: individual iFFT slices */}
      <p className="mb-1 font-mallory-book text-[13px] text-chart-ink">
        1. Inverse FFT of each STFT frame ({frameCount} of {NUM_FRAMES} overlapping slices shown)
      </p>
      <Chart
        width={640}
        height={138}
        label="Overlapping Hann-tapered waveform slices reconstructed by inverse FFT from consecutive STFT frames"
      >
        <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
        <line x1={LEFT} y1={MID} x2={RIGHT} y2={MID} className="stroke-chart-hairline" strokeWidth={0.75} />
        {[LIMIT, 0, -LIMIT].map((v) => (
          <text
            key={v}
            x={LEFT - 7}
            y={MID - (v / LIMIT) * AMP + 3}
            textAnchor="end"
            className="viz-axis"
            style={AXIS}
          >
            {v.toLocaleString("en-GB").replace("-", "−")}
          </text>
        ))}
        {slicePaths.map((d, idx) => {
          const isNewest = idx === slicePaths.length - 1;
          return (
            <path
              key={idx}
              d={d}
              fill="none"
              className={isNewest ? "stroke-chart-series-2" : "stroke-chart-muted"}
              strokeOpacity={isNewest ? 0.95 : 0.4}
              strokeWidth={isNewest ? 1.25 : 0.9}
            />
          );
        })}
        {activeEnvelopePath && (
          <path
            d={activeEnvelopePath}
            fill="none"
            className="stroke-chart-series-2"
            strokeDasharray="3 3"
            strokeOpacity={0.65}
            strokeWidth={1}
          />
        )}
      </Chart>

      {/* Bottom chart: overlap-add sum vs original */}
      <p className="mt-4 mb-1 font-mallory-book text-[13px] text-chart-ink">
        2. Overlap-add sum (colour) vs original waveform (grey)
      </p>
      <Chart
        width={640}
        height={162}
        label="Overlap-add sum of the reconstructed STFT slices compared against the original waveform"
      >
        {frameCount >= 4 && (
          <rect
            x={toChartX(FULL_OVERLAP_START)}
            y={TOP}
            width={Math.max(0, toChartX(Math.min(FULL_OVERLAP_END, frameCount * HOP)) - toChartX(FULL_OVERLAP_START))}
            height={BOTTOM - TOP}
            className="fill-chart-series-1"
            fillOpacity={0.07}
          />
        )}
        <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
        <line x1={LEFT} y1={MID} x2={RIGHT} y2={MID} className="stroke-chart-hairline" strokeWidth={0.75} />
        {[LIMIT, 0, -LIMIT].map((v) => (
          <text
            key={v}
            x={LEFT - 7}
            y={MID - (v / LIMIT) * AMP + 3}
            textAnchor="end"
            className="viz-axis"
            style={AXIS}
          >
            {v.toLocaleString("en-GB").replace("-", "−")}
          </text>
        ))}
        {[0, 20, 40, 60, 80, 100].map((ms) =>
          ms <= viewMs ? (
            <text
              key={ms}
              x={LEFT + (ms / viewMs) * (RIGHT - LEFT)}
              y={BOTTOM + 14}
              textAnchor="middle"
              className="viz-axis"
              style={AXIS}
            >
              {ms}
            </text>
          ) : null
        )}
        <text x={(LEFT + RIGHT) / 2} y={158} textAnchor="middle" className="viz-axis" style={AXIS}>
          Time across 7 overlapping STFT frames around “i” in “times” (milliseconds)
        </text>
        {originalPath && (
          <path d={originalPath} fill="none" className="stroke-chart-muted" strokeOpacity={0.55} strokeWidth={1.35} />
        )}
        {sumPath && (
          <path
            d={sumPath}
            fill="none"
            className={mode === "exact" ? "stroke-chart-series-1" : "stroke-chart-series-2"}
            strokeWidth={1.25}
          />
        )}
      </Chart>

      <Controls className="items-center gap-x-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <TextButton active={mode === "exact"} onClick={() => switchMode("exact")}>
            Keep phase
          </TextButton>
          <TextButton active={mode === "random"} onClick={() => switchMode("random")}>
            Random phase
          </TextButton>
          <TextButton active={animating} onClick={triggerAnimate}>
            {animating ? "Stop" : "Step frames"}
          </TextButton>
        </div>
        <Slider
          label="STFT frames added"
          value={frameCount}
          min={1}
          max={NUM_FRAMES}
          step={1}
          tone="series-1"
          format={(v) => `${v} / ${NUM_FRAMES}`}
          onChange={(v) => {
            setAnimating(false);
            setFrameCount(v);
          }}
        />
      </Controls>
    </Figure>
  );
}
