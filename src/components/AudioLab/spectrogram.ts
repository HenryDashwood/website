import { decibels, FFT_SIZE, HOP, magnitudes, type Sound } from "./audio";

export const SPECTROGRAM_FLOOR = -80;
export const SPECTROGRAM_GRADIENT = "linear-gradient(to right, rgb(20,15,50), rgb(135,69,150), rgb(250,230,50))";

export function spectrogramFrames({ samples }: Sound) {
  return Array.from({ length: Math.ceil(samples.length / HOP) }, (_, i) =>
    magnitudes(samples, FFT_SIZE, i * HOP - FFT_SIZE / 2)
  );
}

export function spectrogramPeak(frames: Float64Array[], rows: number) {
  let peak = 0;
  for (const frame of frames) {
    for (let bin = 0; bin < rows; bin++) peak = Math.max(peak, frame[bin]);
  }
  return peak;
}

export const hzToMel = (hz: number) => 2595 * Math.log10(1 + hz / 700);
const melToHz = (mel: number) => 700 * (10 ** (mel / 2595) - 1);

export function melSpectrogram(frames: Float64Array[], sampleRate: number, maxHz: number, bands: number) {
  const binHz = sampleRate / FFT_SIZE;
  const lastBin = Math.floor(maxHz / binHz);
  const step = hzToMel(maxHz) / bands;
  const filters = Array.from({ length: bands }, (_, band) => {
    // Centre each filter on its displayed row. Adjacent filters overlap.
    const centre = melToHz((band + 0.5) * step);
    const lower = melToHz((band - 0.5) * step);
    const upper = melToHz((band + 1.5) * step);
    const first = Math.max(0, Math.ceil(lower / binHz));
    const last = Math.min(lastBin, Math.floor(upper / binHz));
    const weights = Float64Array.from({ length: last - first + 1 }, (_value, offset) => {
      const hz = (first + offset) * binHz;
      return hz < centre ? (hz - lower) / (centre - lower) : (upper - hz) / (upper - centre);
    });
    return { first, weights, total: weights.reduce((sum, weight) => sum + weight, 0) };
  });

  return frames.map((frame) =>
    Float64Array.from(filters, ({ first, weights, total }) => {
      // A weighted mean of power keeps levels comparable across different band widths.
      const power = weights.reduce((sum, weight, offset) => sum + weight * frame[first + offset] ** 2, 0);
      return Math.sqrt(power / (total || 1));
    })
  );
}

export function drawSpectrogram(canvas: HTMLCanvasElement, frames: Float64Array[], rows: number, peak: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx || !frames.length) return;
  const image = ctx.createImageData(frames.length, rows);
  for (let x = 0; x < frames.length; x++) {
    for (let bin = 0; bin < rows; bin++) {
      const strength = Math.max(0, 1 - decibels(frames[x][bin], peak) / SPECTROGRAM_FLOOR);
      const i = ((rows - 1 - bin) * frames.length + x) * 4;
      image.data[i] = Math.round(20 + strength * 230);
      image.data[i + 1] = Math.round(15 + strength ** 2 * 215);
      image.data[i + 2] = Math.round(50 + Math.sin(strength * Math.PI) * 100);
      image.data[i + 3] = 255;
    }
  }
  canvas.width = frames.length;
  canvas.height = rows;
  ctx.putImageData(image, 0, 0);
}
