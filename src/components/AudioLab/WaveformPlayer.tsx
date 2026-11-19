"use client";

import { useEffect, useMemo, useState } from "react";

import { Axes, Chart, toPath } from "../blog_components/shared/viz";
import { SentencePlayback, useSentencePlayback } from "./SentencePlayback";

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
  const sound = useSentence();
  const samples = sound?.samples ?? null;
  const duration = sound ? sound.samples.length / sound.sampleRate : 0;
  const playback = useSentencePlayback(duration);
  const { time, playing, seek } = playback;

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

  return (
    <figure className="not-prose mx-0 my-10">
      <SentencePlayback src={SRC} playback={playback} label="sentence" />
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
