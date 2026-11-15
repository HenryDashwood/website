"use client";

import { Axes, Chart, toPath } from "../blog_components/shared/viz";
import { AXIS, SRC, useSentence } from "./WaveformPlayer";

const WINDOW = 0.03;
const [LEFT, RIGHT, TOP, BOTTOM] = [44, 352, 8, 128];
const MID = (TOP + BOTTOM) / 2;

// 30 ms of one recording, y range ±limit in 16-bit sample values
function Zoom({ title, src = SRC, start, limit }: { title: string; src?: string; start: number; limit: number }) {
  const sound = useSentence(src);
  let path = "";
  if (sound) {
    const from = Math.round(start * sound.sampleRate);
    const count = Math.round(WINDOW * sound.sampleRate);
    path = toPath(
      Array.from(sound.samples.subarray(from, from + count), (v, i) => [
        LEFT + (i / (count - 1)) * (RIGHT - LEFT),
        MID - ((v * 32768) / limit) * (MID - TOP),
      ])
    );
  }
  return (
    <figure className="m-0">
      <figcaption className="mb-1 text-[13px] text-chart-ink">{title}</figcaption>
      <Chart width={360} height={160} label={`${title}: 30 milliseconds of the waveform`}>
        <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
        {[limit, 0, -limit].map((v) => (
          <text
            key={v}
            x={LEFT - 6}
            y={MID - (v / limit) * (MID - TOP) + 3}
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
            x={LEFT + (ms / 30) * (RIGHT - LEFT)}
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
        <path d={path} fill="none" className="stroke-chart-series-1" strokeWidth={1} />
      </Chart>
    </figure>
  );
}

function Pair({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose my-10 grid grid-cols-1 gap-6 font-mallory-book sm:grid-cols-2 sm:gap-4">{children}</div>
  );
}

// Windows found by measuring the audio: the most periodic stretch of the vowel, and the stretch
// with the most zero crossings. Both share a y range so their sizes compare directly.
export default function SoundZooms() {
  return (
    <Pair>
      <Zoom title="The “i” in “times”" start={2.79} limit={4000} />
      <Zoom title="The “s” in “second”" start={3.34} limit={4000} />
    </Pair>
  );
}

// The same vowel from a second Kokoro voice at almost the same pitch (167 Hz vs 173 Hz).
// The voices differ in loudness, so each plot gets its own y range: the point is the shape.
export function VoiceZooms() {
  return (
    <Pair>
      <Zoom title="The “i” in “times”, voice af_heart" start={2.79} limit={4000} />
      <Zoom
        title="The “i” in “times”, voice af_river"
        src="/audio/kokoro-sentence-river.wav"
        start={2.409}
        limit={9000}
      />
    </Pair>
  );
}
