"use client";

import { useMemo, useState } from "react";

import { Axes, Chart, TextButton, toPath } from "@/components/viz";

import { FFT_SIZE, hann, magnitudes } from "./audio";
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

const SLICE_MID = (TOP + BOTTOM) / 2;
const SLICE_AMP = SLICE_MID - TOP - 4;

// Same sliding window, zoomed into the 43 ms slice so you can see the Hann taper and compare its
// spectrum against a raw rectangular cut
export function HannSlidingWindow() {
  const sound = useSentence();
  const duration = sound ? sound.samples.length / sound.sampleRate : 0;
  const playback = useSentencePlayback(duration);
  const { time, playing, seek } = playback;
  const [taper, setTaper] = useState(true);

  const centre = playing || time > 0 ? time : PARKED;
  const sampleRate = sound?.sampleRate ?? 24000;
  const start = Math.round(centre * sampleRate) - FFT_SIZE / 2;
  const windowSeconds = FFT_SIZE / sampleRate;
  const windowMs = windowSeconds * 1000;

  const stripPath = useMemo(() => (sound ? waveformPath(sound.samples, 12, 628, 4, 38) : ""), [sound]);
  const mags = sound ? magnitudes(sound.samples, PADDED, start, FFT_SIZE, taper) : null;

  let rawPath = "";
  let windowedPath = "";
  if (sound) {
    let sliceMax = 0.14;
    for (let i = 0; i < FFT_SIZE; i++) {
      sliceMax = Math.max(sliceMax, Math.abs(sound.samples[start + i] ?? 0));
    }
    const rawPoints: [number, number][] = [];
    const winPoints: [number, number][] = [];
    for (let i = 0; i < FFT_SIZE; i += 2) {
      const sample = (sound.samples[start + i] ?? 0) / sliceMax;
      const xPos = LEFT + (i / (FFT_SIZE - 1)) * (RIGHT - LEFT);
      const w = taper ? hann(i, FFT_SIZE) : 1;
      rawPoints.push([xPos, SLICE_MID - sample * SLICE_AMP]);
      winPoints.push([xPos, SLICE_MID - sample * w * SLICE_AMP]);
    }
    rawPath = toPath(rawPoints);
    windowedPath = toPath(winPoints);
  }

  const [upperEnv, lowerEnv] = useMemo(() => {
    const steps = 128;
    if (!taper) {
      return [
        toPath([
          [LEFT, SLICE_MID],
          [LEFT, SLICE_MID - SLICE_AMP],
          [RIGHT, SLICE_MID - SLICE_AMP],
          [RIGHT, SLICE_MID],
        ]),
        toPath([
          [LEFT, SLICE_MID],
          [LEFT, SLICE_MID + SLICE_AMP],
          [RIGHT, SLICE_MID + SLICE_AMP],
          [RIGHT, SLICE_MID],
        ]),
      ];
    }
    const top: [number, number][] = [];
    const bot: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const xPos = LEFT + (i / steps) * (RIGHT - LEFT);
      const w = hann(i, steps + 1);
      top.push([xPos, SLICE_MID - w * SLICE_AMP]);
      bot.push([xPos, SLICE_MID + w * SLICE_AMP]);
    }
    return [toPath(top), toPath(bot)];
  }, [taper]);

  const stripX = (t: number) => 12 + (duration ? t / duration : 0) * (628 - 12);

  return (
    <figure className="not-prose mx-0 my-8 font-mallory-book">
      <SentencePlayback src={SRC} playback={playback} label="Hann sliding window audio" />
      <div className="mb-2 flex items-center gap-4">
        <TextButton active={taper} onClick={() => setTaper(true)}>
          Hann window
        </TextButton>
        <TextButton active={!taper} onClick={() => setTaper(false)}>
          Raw cut (no taper)
        </TextButton>
      </div>

      {/* Clickable full-sentence strip showing where the 43 ms window sits */}
      <Chart width={640} height={44} label="Waveform of the sentence; click to move the 43 ms window">
        <path d={stripPath} fill="none" className="stroke-chart-muted" strokeOpacity={0.5} strokeWidth={0.75} />
        <rect
          x={stripX(centre - windowSeconds / 2)}
          y={4}
          width={Math.max(2, stripX(windowSeconds) - 12)}
          height={34}
          className="fill-chart-series-2"
          fillOpacity={0.35}
        />
        <rect x={12} y={4} width={616} height={34} fill="transparent" className="cursor-pointer" onClick={seek} />
      </Chart>

      <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
        <figure className="m-0">
          <figcaption className="mb-1 text-[13px] text-chart-ink">
            {taper ? "43 ms slice, tapered by a Hann window" : "43 ms slice, cut abruptly at the edges"}
          </figcaption>
          <Chart
            width={360}
            height={160}
            label="Zoomed 43 ms slice of the waveform showing the window envelope and tapered samples"
          >
            <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
            <line
              x1={LEFT}
              y1={SLICE_MID}
              x2={RIGHT}
              y2={SLICE_MID}
              className="stroke-chart-hairline"
              strokeWidth={0.75}
            />
            {taper && (
              <path d={rawPath} fill="none" className="stroke-chart-muted" strokeOpacity={0.35} strokeWidth={0.75} />
            )}
            <path d={windowedPath} fill="none" className="stroke-chart-series-1" strokeWidth={1.1} />
            <path
              d={upperEnv}
              fill="none"
              className="stroke-chart-series-2"
              strokeDasharray="3 3"
              strokeOpacity={0.85}
              strokeWidth={1.1}
            />
            <path
              d={lowerEnv}
              fill="none"
              className="stroke-chart-series-2"
              strokeDasharray="3 3"
              strokeOpacity={0.85}
              strokeWidth={1.1}
            />
            {[0, 10, 20, 30, 40].map((ms) => (
              <text
                key={ms}
                x={LEFT + (ms / windowMs) * (RIGHT - LEFT)}
                y={BOTTOM + 12}
                textAnchor="middle"
                className="viz-axis"
                style={AXIS}
              >
                {ms}
              </text>
            ))}
            <text x={(LEFT + RIGHT) / 2} y={156} textAnchor="middle" className="viz-axis" style={AXIS}>
              Time inside window (milliseconds)
            </text>
          </Chart>
        </figure>
        <Plot
          title={taper ? "Spectrum (Hann window)" : "Spectrum (raw cut)"}
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
