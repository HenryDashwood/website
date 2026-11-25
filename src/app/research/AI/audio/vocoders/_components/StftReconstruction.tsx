"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Axes, Chart, Figure, TextButton, toPath } from "@/components/viz";

import { decodeWav, encodeWav, istft, stft, stftMagnitudes, withRandomPhase } from "./stft";

const SRC = "/media/research/AI/audio/representing-audio-data/kokoro-sentence.wav";
// Same 30 ms slice of the "i" in "times" shown in Representing Audio Data
const ZOOM_START = 2.79;
const ZOOM_WINDOW = 0.03;
const LIMIT = 4000;
const [LEFT, RIGHT, TOP, BOTTOM] = [56, 624, 12, 152];
const MID = (TOP + BOTTOM) / 2;
const AXIS = { fontSize: 8.5 };

type Mode = "original" | "exact" | "random";

function slicePath(samples: Float32Array, sampleRate: number) {
  const from = Math.round(ZOOM_START * sampleRate);
  const count = Math.round(ZOOM_WINDOW * sampleRate);
  return toPath(
    Array.from(samples.subarray(from, from + count), (v, i) => [
      LEFT + (i / (count - 1)) * (RIGHT - LEFT),
      MID - ((v * 32768) / LIMIT) * (MID - TOP),
    ])
  );
}

export default function StftReconstruction() {
  const [loaded, setLoaded] = useState<{
    originalPath: string;
    exactPath: string;
    randomPath: string;
    exactUrl: string;
    randomUrl: string;
    maxErr: number;
    duration: number;
  } | null>(null);
  const [mode, setMode] = useState<Mode>("exact");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let live = true;
    let exactUrl: string | null = null;
    let randomUrl: string | null = null;
    fetch(SRC)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!live) return;
        const { samples, sampleRate } = decodeWav(buf);
        const complex = stft(samples);
        const exact = istft(complex);
        const random = istft(withRandomPhase(stftMagnitudes(complex), 42));

        let maxErr = 0;
        for (let i = 0; i < samples.length; i++) {
          maxErr = Math.max(maxErr, Math.abs(samples[i] - exact[i]));
        }

        exactUrl = URL.createObjectURL(new Blob([encodeWav(exact, sampleRate)], { type: "audio/wav" }));
        randomUrl = URL.createObjectURL(new Blob([encodeWav(random, sampleRate)], { type: "audio/wav" }));

        setLoaded({
          originalPath: slicePath(samples, sampleRate),
          exactPath: slicePath(exact, sampleRate),
          randomPath: slicePath(random, sampleRate),
          exactUrl,
          randomUrl,
          maxErr,
          duration: samples.length / sampleRate,
        });
      })
      .catch(() => {});
    return () => {
      live = false;
      if (exactUrl) URL.revokeObjectURL(exactUrl);
      if (randomUrl) URL.revokeObjectURL(randomUrl);
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

  function switchMode(next: Mode) {
    const el = audioRef.current;
    const wasPlaying = el ? !el.paused : false;
    setMode(next);
    setPlaying(false);
    setTime(0);
    if (wasPlaying) {
      requestAnimationFrame(() => {
        audioRef.current?.play().catch(() => {});
      });
    }
  }

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  const audioSrc = useMemo(() => {
    if (!loaded || mode === "original") return SRC;
    return mode === "exact" ? loaded.exactUrl : loaded.randomUrl;
  }, [loaded, mode]);

  const activePath =
    mode === "original" ? loaded?.originalPath : mode === "exact" ? loaded?.exactPath : loaded?.randomPath;
  const duration = loaded?.duration ?? 0;

  return (
    <Figure
      caption={
        mode === "original"
          ? "The original 24 kHz recording, zoomed into 30 ms of the “i” in “times”."
          : mode === "exact"
            ? `Reconstructed from the STFT with both magnitude and phase. It matches the original wave sample for sample (max difference ${loaded ? loaded.maxErr.toExponential(1) : "—"}) and sounds identical.`
            : "Reconstructed from the exact same spectrogram magnitudes with random phase. The crisp repeating pulses smear out, and the voice collapses into harsh, whispery static."
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

      <div className="mb-3 flex items-center gap-3">
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
        <p className="min-w-0 flex-1 font-source-serif text-[15px] text-chart-ink italic">
          “A microphone measures air pressure thousands of times every second.”
        </p>
        <span className="shrink-0 font-mallory-book text-xs text-chart-muted tabular-nums">
          {time.toFixed(2)} / {duration.toFixed(2)} s
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mallory-book">
        <div className="flex flex-wrap items-center gap-4">
          <TextButton active={mode === "original"} onClick={() => switchMode("original")}>
            Original
          </TextButton>
          <TextButton active={mode === "exact"} onClick={() => switchMode("exact")}>
            With phase
          </TextButton>
          <TextButton active={mode === "random"} onClick={() => switchMode("random")}>
            Random phase
          </TextButton>
        </div>
        {mode !== "original" && (
          <div className="flex items-center gap-3 text-[11px] text-chart-muted">
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 14 4" className="h-1 w-3.5" aria-hidden="true">
                <line
                  x1={0}
                  y1={2}
                  x2={14}
                  y2={2}
                  className="stroke-chart-muted"
                  strokeOpacity={0.6}
                  strokeWidth={1.75}
                />
              </svg>
              original
            </span>
            <span
              className={`flex items-center gap-1 ${mode === "exact" ? "text-chart-series-1" : "text-chart-series-2"}`}
            >
              <svg viewBox="0 0 14 4" className="h-1 w-3.5" aria-hidden="true">
                <line
                  x1={0}
                  y1={2}
                  x2={14}
                  y2={2}
                  className={mode === "exact" ? "stroke-chart-series-1" : "stroke-chart-series-2"}
                  strokeWidth={1.75}
                />
              </svg>
              reconstructed
            </span>
          </div>
        )}
      </div>

      <Chart
        width={640}
        height={186}
        label="30 milliseconds of the vowel waveform comparing the original recording against the STFT reconstruction"
      >
        <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
        <line x1={LEFT} y1={MID} x2={RIGHT} y2={MID} className="stroke-chart-hairline" strokeWidth={0.75} />
        {[LIMIT, 0, -LIMIT].map((v) => (
          <text
            key={v}
            x={LEFT - 8}
            y={MID - (v / LIMIT) * (MID - TOP) + 3}
            textAnchor="end"
            className="viz-axis"
            style={AXIS}
          >
            {v.toLocaleString("en-GB").replace("-", "−")}
          </text>
        ))}
        <text x={12} y={MID} transform={`rotate(-90 12 ${MID})`} textAnchor="middle" className="viz-axis" style={AXIS}>
          Amplitude (16-bit)
        </text>
        {[0, 10, 20, 30].map((ms) => (
          <text
            key={ms}
            x={LEFT + (ms / 30) * (RIGHT - LEFT)}
            y={BOTTOM + 14}
            textAnchor="middle"
            className="viz-axis"
            style={AXIS}
          >
            {ms}
          </text>
        ))}
        <text x={(LEFT + RIGHT) / 2} y={181} textAnchor="middle" className="viz-axis" style={AXIS}>
          Time within “i” in “times” (milliseconds)
        </text>

        {loaded && mode !== "original" && (
          <path
            d={loaded.originalPath}
            fill="none"
            className="stroke-chart-muted"
            strokeOpacity={0.5}
            strokeWidth={1.25}
          />
        )}
        {activePath && (
          <path
            d={activePath}
            fill="none"
            className={mode === "random" ? "stroke-chart-series-2" : "stroke-chart-series-1"}
            strokeWidth={1.25}
          />
        )}
      </Chart>
    </Figure>
  );
}
