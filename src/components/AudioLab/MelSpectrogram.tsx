"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Axes, Chart, TextButton } from "../blog_components/shared/viz";
import { FFT_SIZE } from "./audio";
import { SentencePlayback, useSentencePlayback } from "./SentencePlayback";
import {
  drawSpectrogram,
  hzToMel,
  melSpectrogram,
  SPECTROGRAM_FLOOR,
  SPECTROGRAM_GRADIENT,
  spectrogramFrames,
  spectrogramPeak,
} from "./spectrogram";
import { SRC, useSentence } from "./WaveformPlayer";

const [LEFT, RIGHT, TOP, BOTTOM] = [55, 430, 12, 167];
const MID = (TOP + BOTTOM) / 2;
const MAX_HZ = 5000;
const MEL_BANDS = 80;
const AXIS_LABEL = "viz-axis @min-[520px]:text-[8px]!";

export default function MelSpectrogram() {
  const sound = useSentence();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [mel, setMel] = useState(true);
  const duration = sound ? sound.samples.length / sound.sampleRate : 0;
  const playback = useSentencePlayback(duration);
  const { time, playing, seek } = playback;

  const plots = useMemo(() => {
    if (!sound) return null;
    const linear = spectrogramFrames(sound);
    const linearRows = Math.floor((MAX_HZ * FFT_SIZE) / sound.sampleRate) + 1;
    return {
      linear,
      linearRows,
      mel: melSpectrogram(linear, sound.sampleRate, MAX_HZ, MEL_BANDS),
      peak: spectrogramPeak(linear, linearRows),
    };
  }, [sound]);

  useEffect(() => {
    if (canvas.current && plots) {
      drawSpectrogram(canvas.current, mel ? plots.mel : plots.linear, mel ? MEL_BANDS : plots.linearRows, plots.peak);
    }
  }, [mel, plots]);

  const frequencyTicks = mel ? [0, 500, 1000, 2500, 5000] : [0, 1000, 2000, 3000, 4000, 5000];
  const frequencyPosition = (hz: number) => (mel ? hzToMel(hz) / hzToMel(MAX_HZ) : hz / MAX_HZ);
  const playheadX = LEFT + (duration ? time / duration : 0) * (RIGHT - LEFT);

  return (
    <figure className="not-prose @container mx-0 my-10 font-mallory-book">
      <SentencePlayback src={SRC} playback={playback} label="spectrogram audio" />
      <div className="mb-2 flex gap-4" role="group" aria-label="Spectrogram frequency scale">
        <TextButton active={!mel} onClick={() => setMel(false)}>
          Linear scale
        </TextButton>
        <TextButton active={mel} onClick={() => setMel(true)}>
          Mel scale
        </TextButton>
      </div>
      <Chart
        width={440}
        height={204}
        label={`${mel ? "Mel" : "Linear"} spectrogram of the spoken sentence. Time runs left to right, frequency rises from bottom to top, and brighter colours show stronger sounds.`}
      >
        <foreignObject x={LEFT} y={TOP} width={RIGHT - LEFT} height={BOTTOM - TOP}>
          <canvas ref={canvas} aria-hidden="true" className="block h-full w-full [image-rendering:pixelated]" />
        </foreignObject>
        {duration > 0 && (playing || time > 0) && (
          <line
            x1={playheadX}
            x2={playheadX}
            y1={TOP}
            y2={BOTTOM}
            className="stroke-white drop-shadow-[0_0_1px_black]"
            strokeWidth={1.25}
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
        <Axes left={LEFT} top={TOP} right={RIGHT} bottom={BOTTOM} />
        <text x={12} y={MID} transform={`rotate(-90 12 ${MID})`} textAnchor="middle" className={AXIS_LABEL}>
          Frequency (Hz)
        </text>
        {frequencyTicks.map((hz) => (
          <text
            key={hz}
            x={LEFT - 6}
            y={BOTTOM - frequencyPosition(hz) * (BOTTOM - TOP)}
            textAnchor="end"
            dominantBaseline="middle"
            className={AXIS_LABEL}
          >
            {hz.toLocaleString("en-GB")}
          </text>
        ))}
        {duration > 0 &&
          Array.from({ length: Math.floor(duration) + 1 }, (_, seconds) => (
            <text
              key={seconds}
              x={LEFT + (seconds / duration) * (RIGHT - LEFT)}
              y={BOTTOM + 14}
              textAnchor="middle"
              className={AXIS_LABEL}
            >
              {seconds}
            </text>
          ))}
        <text x={(LEFT + RIGHT) / 2} y={200} textAnchor="middle" className={AXIS_LABEL}>
          Time (seconds)
        </text>
      </Chart>
      <figcaption className="mt-2 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs text-chart-muted">
        <span>Relative level</span>
        <span>−{-SPECTROGRAM_FLOOR} dB</span>
        <span aria-hidden="true" className="h-2 w-24" style={{ background: SPECTROGRAM_GRADIENT }} />
        <span>0 dB</span>
      </figcaption>
    </figure>
  );
}
