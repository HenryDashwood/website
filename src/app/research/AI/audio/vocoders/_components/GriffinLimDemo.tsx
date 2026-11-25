"use client";

import { useEffect, useRef, useState } from "react";

import { Axes, Chart, Controls, Figure, Point, Slider, toPath } from "@/components/viz";

import {
  decodeWav,
  encodeWav,
  griffinLim,
  type GriffinLimResult,
  melRoundTrip,
  stft,
  type StftMagnitudes,
  stftMagnitudes,
} from "./stft";

const SRC = "/media/research/AI/audio/representing-audio-data/kokoro-sentence.wav";
const ZOOM_START = 2.79;
const ZOOM_WINDOW = 0.03;
const LIMIT = 4000;
const MAX_ITER = 32;
const AXIS = { fontSize: 8.5 };

type Track = "original" | "linear" | "mel";
type SourceKind = "linear" | "mel";

function slicePath(
  samples: Float32Array,
  sampleRate: number,
  left: number,
  right: number,
  top: number,
  bottom: number
) {
  const mid = (top + bottom) / 2;
  const from = Math.round(ZOOM_START * sampleRate);
  const count = Math.round(ZOOM_WINDOW * sampleRate);
  return toPath(
    Array.from(samples.subarray(from, from + count), (v, i) => [
      left + (i / (count - 1)) * (right - left),
      mid - ((v * 32768) / LIMIT) * (mid - top),
    ])
  );
}

const TRACKS: Array<{ id: Track; label: string; circleClass: string }> = [
  { id: "original", label: "Original", circleClass: "bg-chart-ink" },
  { id: "linear", label: "From linear spectrogram", circleClass: "bg-chart-series-1" },
  { id: "mel", label: "From mel spectrogram", circleClass: "bg-chart-series-2" },
];

export default function GriffinLimDemo() {
  const [loaded, setLoaded] = useState<{
    samples: Float32Array;
    sampleRate: number;
    duration: number;
    linearTarget: StftMagnitudes;
    linearResult: GriffinLimResult;
  } | null>(null);
  const [melResult, setMelResult] = useState<GriffinLimResult | null>(null);
  const [track, setTrack] = useState<Track>("linear");
  const [lastSource, setLastSource] = useState<SourceKind>("linear");
  const [iter, setIter] = useState(MAX_ITER);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string>(SRC);

  useEffect(() => {
    let live = true;
    let melTimer: ReturnType<typeof setTimeout> | null = null;
    fetch(SRC)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!live) return;
        const { samples, sampleRate } = decodeWav(buf);
        const linearTarget = stftMagnitudes(stft(samples));
        const linearResult = griffinLim(linearTarget, MAX_ITER, 42);
        const initialUrl = URL.createObjectURL(
          new Blob([encodeWav(linearResult.samples[MAX_ITER], sampleRate)], { type: "audio/wav" })
        );
        blobUrlRef.current = initialUrl;
        setActiveAudioUrl(initialUrl);
        setLoaded({
          samples,
          sampleRate,
          duration: samples.length / sampleRate,
          linearTarget,
          linearResult,
        });
        melTimer = setTimeout(() => {
          if (!live) return;
          const computed = griffinLim(
            melRoundTrip(linearTarget, sampleRate, 80),
            MAX_ITER,
            42,
            linearTarget.magnitudes
          );
          setMelResult(computed);
        }, 0);
      })
      .catch(() => {});
    return () => {
      live = false;
      if (melTimer) clearTimeout(melTimer);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = requestAnimationFrame(tick);
    function tick() {
      setTime(audioRef.current?.currentTime ?? 0);
      frame = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  function getOrComputeMel(): GriffinLimResult | null {
    if (melResult) return melResult;
    if (!loaded) return null;
    const computed = griffinLim(
      melRoundTrip(loaded.linearTarget, loaded.sampleRate, 80),
      MAX_ITER,
      42,
      loaded.linearTarget.magnitudes
    );
    setMelResult(computed);
    return computed;
  }

  function applyAudio(nextTrack: Track, nextIter: number, autoPlay: boolean) {
    setPlaying(false);
    setTime(0);
    let nextUrl = SRC;
    if (nextTrack !== "original" && loaded) {
      const res = nextTrack === "linear" ? loaded.linearResult : getOrComputeMel();
      if (res) {
        nextUrl = URL.createObjectURL(
          new Blob([encodeWav(res.samples[nextIter], loaded.sampleRate)], { type: "audio/wav" })
        );
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = nextUrl;
      }
    }
    setActiveAudioUrl(nextUrl);

    const el = audioRef.current;
    if (el) {
      el.src = nextUrl;
      el.load();
      if (autoPlay) void el.play().catch(() => {});
    }
  }

  function handleTrackClick(next: Track) {
    const el = audioRef.current;
    if (next === track && el) {
      if (el.paused) void el.play().catch(() => {});
      else el.pause();
      return;
    }
    setTrack(next);
    if (next !== "original") setLastSource(next);
    applyAudio(next, iter, true);
  }

  function changeIter(next: number) {
    const wasPlaying = audioRef.current ? !audioRef.current.paused : false;
    const targetTrack: Track = track === "original" ? lastSource : track;
    setIter(next);
    if (track === "original") setTrack(targetTrack);
    applyAudio(targetTrack, next, wasPlaying);
  }

  const activeResult = track === "linear" ? (loaded?.linearResult ?? null) : track === "mel" ? melResult : null;

  // Left chart: mismatch against the true original spectrogram over iterations 0..32
  const [E_LEFT, E_RIGHT, E_TOP, E_BOTTOM] = [44, 290, 14, 134];
  const maxError = Math.max(
    0.7,
    (loaded?.linearResult.errors[0] ?? 0.65) * 1.05,
    (melResult?.errors[0] ?? 0.65) * 1.05
  );
  const errX = (k: number) => E_LEFT + (k / MAX_ITER) * (E_RIGHT - E_LEFT);
  const errY = (e: number) => E_BOTTOM - (e / maxError) * (E_BOTTOM - E_TOP);
  const linearErrPath = loaded ? toPath(loaded.linearResult.errors.map((e, k) => [errX(k), errY(e)])) : "";
  const melErrPath = melResult ? toPath(melResult.errors.map((e, k) => [errX(k), errY(e)])) : "";

  // Right chart: 30 ms zoom of the "i" in "times"
  const [W_LEFT, W_RIGHT, W_TOP, W_BOTTOM] = [48, 336, 14, 134];
  const W_MID = (W_TOP + W_BOTTOM) / 2;
  const origWavePath = loaded ? slicePath(loaded.samples, loaded.sampleRate, W_LEFT, W_RIGHT, W_TOP, W_BOTTOM) : "";
  const recWavePath =
    loaded && activeResult
      ? slicePath(activeResult.samples[iter], loaded.sampleRate, W_LEFT, W_RIGHT, W_TOP, W_BOTTOM)
      : "";

  const duration = loaded?.duration ?? 0;
  const activeColor = track === "mel" ? "stroke-chart-series-2" : "stroke-chart-series-1";
  const activeTextColor = track === "mel" ? "text-chart-series-2" : "text-chart-series-1";

  return (
    <Figure
      caption={
        track === "original"
          ? "Playing the original 24 kHz recording. Click either spectrogram button above to hear Griffin-Lim reconstruct it from magnitudes alone."
          : track === "linear"
            ? `Reconstructing from the 513-bin linear spectrogram after ${iter} iteration${iter === 1 ? "" : "s"} (mismatch ${activeResult ? `${Math.round(activeResult.errors[iter] * 100)}%` : "—"}). Overlapping windows pull the phases into agreement so the vowel becomes periodic again — yet the pulse shape never matches the crisp grey original, leaving a hollow shimmer.`
            : `Reconstructing from the 80-band mel spectrogram after ${iter} iteration${iter === 1 ? "" : "s"} (mismatch ${activeResult ? `${Math.round(activeResult.errors[iter] * 100)}%` : "—"} vs ${loaded ? `${Math.round(loaded.linearResult.errors[iter] * 100)}%` : "—"} for linear). Averaging 513 bins down to 80 mel bands permanently blurs fine frequency detail before Griffin-Lim starts, raising the error floor and muffling the voice.`
      }
    >
      <audio
        ref={audioRef}
        src={activeAudioUrl}
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {TRACKS.map((item) => {
            const isSelected = track === item.id;
            const isPlayingThis = isSelected && playing;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleTrackClick(item.id)}
                className="group flex min-h-7 cursor-pointer items-center gap-2 font-mallory-book text-[13px]"
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-white transition-opacity ${
                    item.circleClass
                  } ${isSelected ? "opacity-100" : "opacity-45 group-hover:opacity-85"}`}
                >
                  <svg viewBox="0 0 16 16" className="size-2.5 fill-current" aria-hidden="true">
                    {isPlayingThis ? <path d="M3 2h3.5v12H3zM9.5 2H13v12h-3.5z" /> : <path d="M4 1.5v13L14 8z" />}
                  </svg>
                </span>
                <span
                  className={`underline-offset-4 group-hover:text-chart-ink group-hover:underline ${
                    isSelected ? "text-chart-ink underline decoration-nav-background decoration-2" : "text-chart-muted"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <span className="shrink-0 font-mallory-book text-xs text-chart-muted tabular-nums">
          {time.toFixed(2)} / {duration.toFixed(2)} s
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
        <div>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 font-mallory-book">
            <p className="text-[13px] text-chart-ink">Mismatch vs original</p>
            <div className="flex items-center gap-2.5 text-[11px] text-chart-muted">
              <span className={`flex items-center gap-1 ${track === "linear" ? "text-chart-series-1" : ""}`}>
                <svg viewBox="0 0 12 4" className="h-1 w-3" aria-hidden="true">
                  <line
                    x1={0}
                    y1={2}
                    x2={12}
                    y2={2}
                    className="stroke-chart-series-1"
                    strokeOpacity={track === "mel" ? 0.4 : 1}
                    strokeWidth={1.75}
                  />
                </svg>
                linear
              </span>
              <span className={`flex items-center gap-1 ${track === "mel" ? "text-chart-series-2" : ""}`}>
                <svg viewBox="0 0 12 4" className="h-1 w-3" aria-hidden="true">
                  <line
                    x1={0}
                    y1={2}
                    x2={12}
                    y2={2}
                    className="stroke-chart-series-2"
                    strokeOpacity={track === "linear" ? 0.4 : 1}
                    strokeWidth={1.75}
                  />
                </svg>
                mel
              </span>
            </div>
          </div>
          <Chart
            width={305}
            height={166}
            label="Spectrogram mismatch against the original recording dropping across Griffin-Lim iterations from 0 to 32 for linear and mel inputs"
          >
            <Axes left={E_LEFT} right={E_RIGHT} top={E_TOP} bottom={E_BOTTOM} />
            {[0, 0.2, 0.4, 0.6].map((v) =>
              v <= maxError ? (
                <text key={v} x={E_LEFT - 6} y={errY(v) + 3} textAnchor="end" className="viz-axis" style={AXIS}>
                  {Math.round(v * 100)}%
                </text>
              ) : null
            )}
            {[0, 8, 16, 24, 32].map((k) => (
              <text key={k} x={errX(k)} y={E_BOTTOM + 13} textAnchor="middle" className="viz-axis" style={AXIS}>
                {k}
              </text>
            ))}
            <text x={(E_LEFT + E_RIGHT) / 2} y={162} textAnchor="middle" className="viz-axis" style={AXIS}>
              Iterations
            </text>
            {linearErrPath && (
              <path
                d={linearErrPath}
                fill="none"
                className="stroke-chart-series-1"
                strokeOpacity={track === "linear" ? 1 : track === "original" ? 0.6 : 0.35}
                strokeWidth={track === "linear" ? 2 : 1.25}
              />
            )}
            {melErrPath && (
              <path
                d={melErrPath}
                fill="none"
                className="stroke-chart-series-2"
                strokeOpacity={track === "mel" ? 1 : track === "original" ? 0.6 : 0.35}
                strokeWidth={track === "mel" ? 2 : 1.25}
              />
            )}
            {track === "linear" && loaded && <Point x={errX(iter)} y={errY(loaded.linearResult.errors[iter])} />}
            {track === "mel" && melResult && <Point x={errX(iter)} y={errY(melResult.errors[iter])} />}
          </Chart>
        </div>

        <div>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 font-mallory-book">
            <p className="text-[13px] text-chart-ink">Waveform “i” (30 ms)</p>
            <div className="flex items-center gap-2.5 text-[11px] text-chart-muted">
              <span className={`flex items-center gap-1 ${track === "original" ? "text-chart-ink" : ""}`}>
                <svg viewBox="0 0 12 4" className="h-1 w-3" aria-hidden="true">
                  <line
                    x1={0}
                    y1={2}
                    x2={12}
                    y2={2}
                    className={track === "original" ? "stroke-chart-ink" : "stroke-chart-muted"}
                    strokeOpacity={track === "original" ? 1 : 0.6}
                    strokeWidth={1.5}
                  />
                </svg>
                original
              </span>
              {track !== "original" && (
                <span className={`flex items-center gap-1 ${activeTextColor}`}>
                  <svg viewBox="0 0 12 4" className="h-1 w-3" aria-hidden="true">
                    <line x1={0} y1={2} x2={12} y2={2} className={activeColor} strokeWidth={1.5} />
                  </svg>
                  {track === "linear" ? "from linear" : "from mel"}
                </span>
              )}
            </div>
          </div>
          <Chart
            width={350}
            height={166}
            label="30 milliseconds of the vowel waveform comparing the original recording with the Griffin-Lim reconstruction"
          >
            <Axes left={W_LEFT} right={W_RIGHT} top={W_TOP} bottom={W_BOTTOM} />
            <line
              x1={W_LEFT}
              y1={W_MID}
              x2={W_RIGHT}
              y2={W_MID}
              className="stroke-chart-hairline"
              strokeWidth={0.75}
            />
            {[LIMIT, 0, -LIMIT].map((v) => (
              <text
                key={v}
                x={W_LEFT - 6}
                y={W_MID - (v / LIMIT) * (W_MID - W_TOP) + 3}
                textAnchor="end"
                className="viz-axis"
                style={AXIS}
              >
                {v.toLocaleString("en-GB").replace("-", "−")}
              </text>
            ))}
            {[0, 10, 20, 30].map((ms) => (
              <text
                key={ms}
                x={W_LEFT + (ms / 30) * (W_RIGHT - W_LEFT)}
                y={W_BOTTOM + 13}
                textAnchor="middle"
                className="viz-axis"
                style={AXIS}
              >
                {ms}
              </text>
            ))}
            <text x={(W_LEFT + W_RIGHT) / 2} y={162} textAnchor="middle" className="viz-axis" style={AXIS}>
              Time (milliseconds)
            </text>
            {origWavePath && (
              <path
                d={origWavePath}
                fill="none"
                className={track === "original" ? "stroke-chart-ink" : "stroke-chart-muted"}
                strokeOpacity={track === "original" ? 1 : 0.45}
                strokeWidth={track === "original" ? 1.2 : 1.1}
              />
            )}
            {recWavePath && <path d={recWavePath} fill="none" className={activeColor} strokeWidth={1.2} />}
          </Chart>
        </div>
      </div>

      <Controls>
        <Slider
          label="Griffin-Lim iterations"
          value={iter}
          min={0}
          max={MAX_ITER}
          step={1}
          tone={track === "mel" ? "series-2" : track === "linear" ? "series-1" : "ink"}
          format={(v) => `${v}`}
          onChange={changeIter}
        />
      </Controls>
    </Figure>
  );
}
