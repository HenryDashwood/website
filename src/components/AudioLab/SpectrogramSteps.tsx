"use client";

import { useMemo } from "react";

import { Axes, Chart } from "../blog_components/shared/viz";
import { FFT_SIZE, magnitudes } from "./audio";
import { SentencePlayback, useSentencePlayback } from "./SentencePlayback";
import { Plot } from "./Spectra";
import { SPECTROGRAM_FLOOR } from "./spectrogram";
import { AXIS, SRC, useSentence, waveformPath } from "./WaveformPlayer";

// These figures lead into the spectrogram, so they share its range (0–12 kHz) and floor (−80 dB)
const MAX_HZ = 12000;
const PADDED = 4096;

// One spectrum of the whole 3.85 s sentence: every vowel, hiss and gap averaged together
export function WholeSentenceSpectrum() {
  const sound = useSentence();
  const { mags, binHz } = useMemo(() => {
    if (!sound) return { mags: null, binHz: 1 };
    const size = 2 ** Math.ceil(Math.log2(sound.samples.length));
    return { mags: magnitudes(sound.samples, size, 0, sound.samples.length), binHz: sound.sampleRate / size };
  }, [sound]);
  return (
    <div className="not-prose my-10 sm:w-[calc(50%-0.5rem)]">
      <Plot
        title="Spectrum of the whole sentence"
        mags={mags}
        binHz={binHz}
        db
        maxHz={MAX_HZ}
        floor={SPECTROGRAM_FLOOR}
      />
    </div>
  );
}

const [LEFT, RIGHT, TOP, BOTTOM] = [12, 352, 8, 128];
// Before playback starts, park the window on the steady part of the vowel in "times"
const PARKED = 2.805 + FFT_SIZE / 2 / 24000;

// The waveform with a 43 ms window that follows the playhead, and the spectrum of what's inside it
export function SlidingWindow() {
  const sound = useSentence();
  const duration = sound ? sound.samples.length / sound.sampleRate : 0;
  const playback = useSentencePlayback(duration);
  const { time, playing, seek } = playback;
  const centre = playing || time > 0 ? time : PARKED;
  const path = useMemo(() => (sound ? waveformPath(sound.samples, LEFT, RIGHT, TOP, BOTTOM) : ""), [sound]);
  const sampleRate = sound?.sampleRate ?? 24000;
  const start = Math.round(centre * sampleRate) - FFT_SIZE / 2;
  const mags = sound ? magnitudes(sound.samples, PADDED, start, FFT_SIZE) : null;
  const x = (t: number) => LEFT + (duration ? t / duration : 0) * (RIGHT - LEFT);
  const windowSeconds = FFT_SIZE / sampleRate;

  return (
    <figure className="not-prose mx-0 my-10 font-mallory-book">
      <SentencePlayback src={SRC} playback={playback} label="sliding window audio" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
        <figure className="m-0">
          <figcaption className="mb-1 text-[13px] text-chart-ink">Waveform, with a 43 ms window</figcaption>
          <Chart
            width={360}
            height={160}
            label="Waveform of the sentence with a short window marking the stretch being analysed"
          >
            <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
            <path d={path} fill="none" className="stroke-chart-muted" strokeOpacity={0.6} strokeWidth={0.75} />
            <rect
              x={x(centre - windowSeconds / 2)}
              y={TOP}
              width={Math.max(1.5, x(windowSeconds) - LEFT)}
              height={BOTTOM - TOP}
              className="fill-chart-series-2"
              fillOpacity={0.35}
            />
            {duration > 0 &&
              Array.from({ length: Math.floor(duration) + 1 }, (_, s) => (
                <text key={s} x={x(s)} y={BOTTOM + 12} textAnchor="middle" className="viz-axis" style={AXIS}>
                  {s}
                </text>
              ))}
            <text x={(LEFT + RIGHT) / 2} y={156} textAnchor="middle" className="viz-axis" style={AXIS}>
              Time (seconds)
            </text>
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
        <Plot
          title="Spectrum of the window"
          mags={mags}
          binHz={sampleRate / PADDED}
          db
          maxHz={MAX_HZ}
          floor={SPECTROGRAM_FLOOR}
        />
      </div>
    </figure>
  );
}
