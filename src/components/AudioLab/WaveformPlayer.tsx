"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Axes, Chart, toPath } from "../blog_components/shared/viz";

export const SRC = "/audio/kokoro-sentence.wav";
const [LEFT, RIGHT, TOP, BOTTOM] = [64, 624, 10, 136];
// The chart scales up with the column, so its labels use smaller units to stay near caption size
export const AXIS = { fontSize: 8.5 };
// 16-bit samples, shown at full scale so the plot reveals how much of the range the sentence uses
const TICKS = [32767, 16384, 0, -16384, -32768];
const MID = (TOP + BOTTOM) / 2;

// Decode the same file the <audio> element plays so plots show its actual samples
export function useSentence(src = SRC) {
  const [sound, setSound] = useState<{ samples: Float32Array; sampleRate: number } | null>(null);
  useEffect(() => {
    let live = true;
    fetch(src)
      .then((r) => r.arrayBuffer())
      .then((data) => new OfflineAudioContext(1, 1, 24000).decodeAudioData(data))
      .then((buffer) => {
        if (live) setSound({ samples: buffer.getChannelData(0), sampleRate: buffer.sampleRate });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [src]);
  return sound;
}

export default function WaveformPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const sound = useSentence();
  const samples = sound?.samples ?? null;
  const sampleRate = sound?.sampleRate ?? 24000;
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Follow the playhead every frame while playing
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      setTime(audio.current?.currentTime ?? 0);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const duration = samples ? samples.length / sampleRate : 0;
  const path = useMemo(() => {
    if (!samples) return "";
    // Min/max per bucket keeps short peaks visible at this zoom
    const points: [number, number][] = [];
    const step = Math.ceil(samples.length / 1500);
    for (let i = 0; i < samples.length; i += step) {
      let [min, max] = [1, -1];
      for (let j = i; j < Math.min(samples.length, i + step); j++) {
        min = Math.min(min, samples[j]);
        max = Math.max(max, samples[j]);
      }
      const x = LEFT + (i / samples.length) * (RIGHT - LEFT);
      points.push([x, MID - max * (MID - TOP)], [x, MID - min * (MID - TOP)]);
    }
    return toPath(points);
  }, [samples]);

  const playheadX = LEFT + (duration ? time / duration : 0) * (RIGHT - LEFT);

  function toggle() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  function seek(event: React.MouseEvent<SVGRectElement>) {
    const el = audio.current;
    const box = event.currentTarget.getBoundingClientRect();
    if (!el || !duration) return;
    el.currentTime = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)) * duration;
    setTime(el.currentTime);
  }

  return (
    <figure className="not-prose mx-0 my-10">
      <audio
        ref={audio}
        src={SRC}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
      />
      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-chart-series-1 text-white hover:opacity-85"
        >
          <svg viewBox="0 0 16 16" className="size-3 fill-current" aria-hidden="true">
            {playing ? <path d="M3 2h3.5v12H3zM9.5 2H13v12H9.5z" /> : <path d="M4 1.5v13L14 8z" />}
          </svg>
        </button>
        <p className="min-w-0 flex-1 font-source-serif text-[15px] text-chart-ink italic">
          “A microphone measures air pressure thousands of times every second.”
        </p>
        <span className="font-mallory-book text-xs text-chart-muted tabular-nums">
          {time.toFixed(2)} / {duration.toFixed(2)} s
        </span>
      </div>
      <Chart
        width={640}
        height={170}
        label="Waveform of a spoken sentence, with a playhead that moves during playback"
      >
        <defs>
          <clipPath id="waveform-played">
            <rect x={LEFT} y={0} width={Math.max(0, playheadX - LEFT)} height={170} />
          </clipPath>
        </defs>
        <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
        <text x={10} y={MID} transform={`rotate(-90 10 ${MID})`} textAnchor="middle" className="viz-axis" style={AXIS}>
          Sample value (16-bit)
        </text>
        {TICKS.map((v) => (
          <text
            key={v}
            x={LEFT - 8}
            y={MID - (v / 32768) * (MID - TOP) + 4}
            textAnchor="end"
            className="viz-axis"
            style={AXIS}
          >
            {v.toLocaleString("en-GB").replace("-", "−")}
          </text>
        ))}
        {duration > 0 &&
          Array.from({ length: Math.floor(duration) + 1 }, (_, s) => (
            <text
              key={s}
              x={LEFT + (s / duration) * (RIGHT - LEFT)}
              y={BOTTOM + 15}
              textAnchor="middle"
              className="viz-axis"
              style={AXIS}
            >
              {s}
            </text>
          ))}
        <text x={(LEFT + RIGHT) / 2} y={166} textAnchor="middle" className="viz-axis" style={AXIS}>
          Time (seconds)
        </text>
        <path d={path} fill="none" className="stroke-chart-muted" strokeOpacity={0.45} strokeWidth={1} />
        <path
          d={path}
          fill="none"
          className="stroke-chart-series-1"
          strokeWidth={1}
          clipPath="url(#waveform-played)"
        />
        {(playing || time > 0) && (
          <line
            x1={playheadX}
            x2={playheadX}
            y1={TOP}
            y2={BOTTOM}
            className="stroke-chart-series-2"
            strokeWidth={1.5}
          />
        )}
        <rect
          x={LEFT}
          y={TOP}
          width={RIGHT - LEFT}
          height={BOTTOM - TOP}
          fill="transparent"
          className="cursor-pointer"
          onClick={seek}
        />
      </Chart>
    </figure>
  );
}
