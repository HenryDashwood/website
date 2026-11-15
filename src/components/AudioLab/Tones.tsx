"use client";

import { Axes, Chart, toPath } from "../blog_components/shared/viz";
import { AXIS } from "./WaveformPlayer";

// Sums of sine waves at multiples of a 170 Hz voice, drawn over 15 ms on a shared y range
// so every plot in the article is directly comparable
const MS = 15;
const LIMIT = 2.3;
const [LEFT, RIGHT, TOP, BOTTOM] = [12, 352, 8, 128];
const MID = (TOP + BOTTOM) / 2;

interface Part {
  freq: number;
  strength?: number;
  phase?: number;
}

const value = (t: number, parts: Part[]) =>
  parts.reduce(
    (sum, { freq, strength = 1, phase = 0 }) => sum + strength * Math.sin(2 * Math.PI * freq * t + phase),
    0
  );

const curve = (parts: Part[]) =>
  toPath(
    Array.from({ length: 400 }, (_, i) => [
      LEFT + (i / 399) * (RIGHT - LEFT),
      MID - (value((i / 399) * (MS / 1000), parts) / LIMIT) * (MID - TOP),
    ])
  );

// One AudioContext for the page, so starting one tone stops the last
let context: AudioContext | null = null;
let playing: AudioBufferSourceNode | null = null;

async function play(parts: Part[]) {
  context ??= new AudioContext();
  await context.resume();
  playing?.stop();
  const rate = context.sampleRate;
  const buffer = context.createBuffer(1, rate, rate);
  const data = buffer.getChannelData(0);
  // One second, with 20 ms fades so the start and end don't click
  for (let i = 0; i < rate; i++) {
    const fade = Math.min(1, i / (0.02 * rate), (rate - i) / (0.02 * rate));
    data[i] = (0.25 * fade * value(i / rate, parts)) / LIMIT;
  }
  playing = context.createBufferSource();
  playing.buffer = buffer;
  playing.connect(context.destination);
  playing.start();
}

export function Tone({ title, parts, showParts = false }: { title: string; parts: Part[]; showParts?: boolean }) {
  return (
    <figure className="m-0 font-mallory-book">
      <figcaption className="mb-1 flex items-center gap-2 text-[13px] text-chart-ink">
        <button
          type="button"
          onClick={() => void play(parts)}
          aria-label={`Play: ${title}`}
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-chart-series-1 text-white hover:opacity-85"
        >
          <svg viewBox="0 0 16 16" className="size-2.5 fill-current" aria-hidden="true">
            <path d="M4 1.5v13L14 8z" />
          </svg>
        </button>
        {title}
      </figcaption>
      <Chart width={360} height={160} label={title}>
        <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
        {showParts &&
          parts.map((part) => (
            <path
              key={part.freq}
              d={curve([part])}
              fill="none"
              className="stroke-chart-muted"
              strokeOpacity={0.5}
              strokeWidth={0.75}
            />
          ))}
        <path d={curve(parts)} fill="none" className="stroke-chart-series-1" strokeWidth={1.5} />
        {[0, 5, 10, 15].map((ms) => (
          <text
            key={ms}
            x={LEFT + (ms / MS) * (RIGHT - LEFT)}
            y={BOTTOM + 12}
            textAnchor="middle"
            className="viz-axis"
            style={AXIS}
          >
            {ms}
          </text>
        ))}
        <text x={(LEFT + RIGHT) / 2} y={156} textAnchor="middle" className="viz-axis" style={AXIS}>
          Time (milliseconds)
        </text>
      </Chart>
    </figure>
  );
}

// Single plots stay the same size as the paired ones
const Single = ({ children }: { children: React.ReactNode }) => (
  <div className="not-prose my-10 sm:w-[calc(50%-0.5rem)]">{children}</div>
);

export const LowTone = () => (
  <Single>
    <Tone title="A sine wave at 170 Hz" parts={[{ freq: 170 }]} />
  </Single>
);

export const HighTone = () => (
  <Single>
    <Tone title="A sine wave at 340 Hz" parts={[{ freq: 340, strength: 0.5 }]} />
  </Single>
);

export const SumTone = () => (
  <Single>
    <Tone title="The two added together" parts={[{ freq: 170 }, { freq: 340, strength: 0.5 }]} showParts />
  </Single>
);
