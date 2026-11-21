"use client";

import { useMemo } from "react";

import { Axes, Chart } from "@/components/viz";

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
// Half the 24 kHz sample rate: the highest frequency the file can hold, and the range TTS models use
const MAX_HZ = 12000;
const MEL_BANDS = 80;
const AXIS_LABEL = "viz-axis @min-[520px]:text-[8px]!";

function Spectrogram({ mel }: { mel: boolean }) {
  const sound = useSentence();
  const duration = sound ? sound.samples.length / sound.sampleRate : 0;
  const playback = useSentencePlayback(duration);
  const { time, playing, seek } = playback;

  // Render the frames to an image once; an SVG <image> scales with the chart in every browser,
  // unlike a canvas inside <foreignObject>, which Safari can misplace when the SVG is scaled
  const image = useMemo(() => {
    if (!sound) return null;
    const linear = spectrogramFrames(sound);
    const linearRows = Math.floor((MAX_HZ * FFT_SIZE) / sound.sampleRate) + 1;
    const peak = spectrogramPeak(linear, linearRows);
    const canvas = document.createElement("canvas");
    if (mel) drawSpectrogram(canvas, melSpectrogram(linear, sound.sampleRate, MAX_HZ, MEL_BANDS), MEL_BANDS, peak);
    else drawSpectrogram(canvas, linear, linearRows, peak);
    return canvas.toDataURL();
  }, [sound, mel]);

  const frequencyTicks = mel ? [0, 500, 1000, 2000, 4000, 8000, 12000] : [0, 2000, 4000, 6000, 8000, 10000, 12000];
  const frequencyPosition = (hz: number) => (mel ? hzToMel(hz) / hzToMel(MAX_HZ) : hz / MAX_HZ);
  const playheadX = LEFT + (duration ? time / duration : 0) * (RIGHT - LEFT);

  return (
    <figure className="not-prose @container mx-0 my-10 font-mallory-book">
      <SentencePlayback src={SRC} playback={playback} label={`${mel ? "mel" : "linear"} spectrogram audio`} />
      <Chart
        width={440}
        height={204}
        label={`${mel ? "Mel" : "Linear"} spectrogram of the spoken sentence. Time runs left to right, frequency rises from bottom to top, and brighter colours show stronger sounds.`}
      >
        {image && (
          <image
            href={image}
            x={LEFT}
            y={TOP}
            width={RIGHT - LEFT}
            height={BOTTOM - TOP}
            preserveAspectRatio="none"
            style={{ imageRendering: "pixelated" }}
          />
        )}
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
          {mel ? "Frequency (Hz, mel scale)" : "Frequency (Hz)"}
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

export const LinearSpectrogram = () => <Spectrogram mel={false} />;
export const MelSpectrogram = () => <Spectrogram mel />;
