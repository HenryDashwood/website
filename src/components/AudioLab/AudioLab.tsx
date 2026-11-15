"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { Axes, Chart, Controls, Slider, TextButton, toPath } from "../blog_components/shared/viz";
import {
  decibels,
  FFT_SIZE,
  HOP,
  magnitudes,
  signalLevel,
  type Sound,
  synthesize,
  vowelSegment,
  waveformLimit,
} from "./audio";

const LEFT = 44;
const RIGHT = 424;
const TOP = 20;
const BOTTOM = 116;
const labels = { buzz: "Buzz", ah: "Aah", ee: "Eee" };
const series = ["stroke-chart-series-1", "stroke-chart-series-2", "stroke-chart-ink"];

function LinePlot({
  sounds,
  spectrum = false,
  zoom = false,
}: {
  sounds: { label: string; sound: Sound }[];
  spectrum?: boolean;
  zoom?: boolean;
}) {
  const amplitudeLimit = useMemo(
    () =>
      spectrum
        ? 1
        : waveformLimit(
            sounds.map(({ sound }) =>
              zoom ? sound.samples.subarray(0, Math.round(sound.sampleRate * 0.03)) : sound.samples
            )
          ),
    [sounds, spectrum, zoom]
  );
  const paths = useMemo(
    () =>
      sounds.map(({ sound }) => {
        const { samples, sampleRate } = sound;
        if (spectrum) {
          const size = 2 ** Math.floor(Math.log2(Math.min(samples.length, 16384)));
          const values = magnitudes(samples.subarray(0, size), size);
          const peak = values.reduce((max, v) => Math.max(max, v), 0);
          return toPath(
            Array.from(values, (v, i) => {
              const frequency = (i * sampleRate) / size;
              return frequency > 4000
                ? null
                : [
                    LEFT + (frequency / 4000) * (RIGHT - LEFT),
                    TOP + (Math.min(60, -decibels(v, peak)) / 60) * (BOTTOM - TOP),
                  ];
            })
          );
        }
        const count = zoom ? Math.min(samples.length, Math.round(sampleRate * 0.03)) : samples.length;
        // Min/max buckets preserve short peaks when drawing a full recording.
        const points: [number, number][] = [];
        const step = Math.max(1, Math.ceil(count / 1200));
        for (let i = 0; i < count; i += step) {
          let min = 1,
            max = -1;
          for (let j = i; j < Math.min(count, i + step); j++) {
            min = Math.min(min, samples[j]);
            max = Math.max(max, samples[j]);
          }
          const x = LEFT + (i / Math.max(1, count - 1)) * (RIGHT - LEFT);
          points.push([x, (TOP + BOTTOM) / 2 - ((max / amplitudeLimit) * (BOTTOM - TOP)) / 2]);
          if (step > 1) points.push([x, (TOP + BOTTOM) / 2 - ((min / amplitudeLimit) * (BOTTOM - TOP)) / 2]);
        }
        return toPath(points);
      }),
    [sounds, spectrum, zoom, amplitudeLimit]
  );
  const duration = zoom ? 30 : sounds[0].sound.samples.length / sounds[0].sound.sampleRate;
  return (
    <div className="mt-2">
      <Chart
        width={440}
        height={155}
        label={
          spectrum
            ? "Frequency spectrum, relative to each sound’s strongest frequency"
            : zoom
              ? "First 30 milliseconds of each vowel"
              : "Recording waveform"
        }
      >
        <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
        <text x={LEFT} y={14} className="viz-axis">
          {spectrum ? "Level (dB)" : "Amplitude (auto-scaled)"}
        </text>
        {(spectrum ? [0, -20, -40, -60] : [amplitudeLimit, 0, -amplitudeLimit]).map((v) => (
          <text
            key={v}
            x={LEFT - 8}
            y={
              (spectrum
                ? TOP - (v / 60) * (BOTTOM - TOP)
                : (TOP + BOTTOM) / 2 - ((v / amplitudeLimit) * (BOTTOM - TOP)) / 2) + 4
            }
            textAnchor="end"
            className="viz-axis"
          >
            {spectrum || v === 0 ? v : Number(v.toPrecision(2))}
          </text>
        ))}
        {[0, 1, 2, 3, 4].map((v) => (
          <text key={v} x={LEFT + (v / 4) * (RIGHT - LEFT)} y={BOTTOM + 15} textAnchor="middle" className="viz-axis">
            {spectrum ? v * 1000 : ((v / 4) * duration).toFixed(zoom ? 1 : 2)}
          </text>
        ))}
        <text x={RIGHT} y={151} textAnchor="end" className="viz-axis">
          {spectrum ? "Frequency (Hz)" : zoom ? "Time (milliseconds)" : "Time (seconds)"}
        </text>
        {paths.map((d, i) => (
          <path key={sounds[i].label} d={d} fill="none" className={series[i % series.length]} strokeWidth={1} />
        ))}
      </Chart>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
        {sounds.map(({ label }, i) => (
          <span key={label} className="flex items-center gap-2">
            <svg width="20" height="6" aria-hidden="true">
              <path d="M0 3H20" className={series[i % series.length]} strokeWidth={2} />
            </svg>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Spectrogram({ sound }: { sound: Sound }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const frames = Math.ceil(sound.samples.length / HOP);
    const maxBin = Math.min(FFT_SIZE / 2, Math.floor((5000 * FFT_SIZE) / sound.sampleRate));
    const spectra = Array.from({ length: frames }, (_, i) =>
      magnitudes(sound.samples, FFT_SIZE, i * HOP - FFT_SIZE / 2)
    );
    let peak = 0;
    for (const frame of spectra) for (const value of frame) peak = Math.max(peak, value);
    const image = ctx.createImageData(frames, maxBin + 1);
    for (let x = 0; x < frames; x++)
      for (let bin = 0; bin <= maxBin; bin++) {
        const strength = Math.max(0, 1 + decibels(spectra[x][bin], peak) / 80);
        const i = ((maxBin - bin) * frames + x) * 4;
        image.data[i] = Math.round(20 + strength * 230);
        image.data[i + 1] = Math.round(15 + strength ** 2 * 215);
        image.data[i + 2] = Math.round(50 + Math.sin(strength * Math.PI) * 100);
        image.data[i + 3] = 255;
      }
    ctx.canvas.width = frames;
    ctx.canvas.height = maxBin + 1;
    ctx.putImageData(image, 0, 0);
  }, [sound]);
  return (
    <div className="mt-2">
      <div className="mb-1 text-[11px] text-chart-muted">Frequency: 0–5,000 Hz ↑</div>
      <canvas
        ref={canvas}
        role="img"
        aria-label="Spectrogram: time runs left to right, frequency bottom to top, and brighter colours indicate stronger frequencies"
        className="h-24 w-full"
      />
      <div className="mt-1 flex justify-between text-[11px]">
        <span>0 s</span>
        <span>Time (seconds)</span>
        <span>{(sound.samples.length / sound.sampleRate).toFixed(2)} s</span>
      </div>
      <div className="mt-1 flex items-center justify-end gap-2 text-[11px]">
        <span>−80 dB</span>
        <span
          className="h-3 w-28"
          style={{ background: "linear-gradient(to right, rgb(20,15,50), rgb(135,69,150), rgb(250,230,50))" }}
        />
        <span>0 dB</span>
      </div>
    </div>
  );
}

function PlotPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded border border-chart-muted/25 p-3">
      <h4 className="text-sm font-bold">{title}</h4>
      {children}
    </section>
  );
}

export default function AudioLab() {
  const [pitch, setPitch] = useState(100);
  const synthetic = useMemo(
    () => ({ buzz: synthesize("buzz", pitch), ah: synthesize("ah", pitch), ee: synthesize("ee", pitch) }),
    [pitch]
  );
  const [speech, setSpeech] = useState<Sound | null>(null);
  const [ah, setAh] = useState<Sound | null>(null);
  const [ee, setEe] = useState<Sound | null>(null);
  const [selectedKind, setSelectedKind] = useState<"speech" | "ah" | "ee">("speech");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"requesting" | "recording" | "processing" | null>(null);
  const [inputDb, setInputDb] = useState(-90);
  const [inputName, setInputName] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [recordingLabel, setRecordingLabel] = useState("Recorded speech");
  const [recordingInfo, setRecordingInfo] = useState("");
  const stopMeter = useRef<(() => void) | null>(null);
  const context = useRef<AudioContext | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  const player = useRef<AudioBufferSourceNode | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopMeter.current?.();
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      player.current?.stop();
      void context.current?.close();
    };
  }, []);

  async function audioContext() {
    context.current ??= new AudioContext();
    await context.current.resume();
    return context.current;
  }

  async function record(kind: "speech" | "ah" | "ee") {
    setError("");
    setBusy(kind);
    setPhase("requesting");
    setInputDb(-90);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined")
        throw new Error("Recording needs a supported browser on HTTPS or localhost.");
      player.current?.stop();
      player.current = null;
      const ctx = await audioContext();
      const input = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId }, channelCount: 1 } : { channelCount: 1 },
      });
      if (!mounted.current) {
        input.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = input;
      setInputName(input.getAudioTracks()[0]?.label || "Default microphone");
      void navigator.mediaDevices
        .enumerateDevices()
        .then((available) => {
          if (mounted.current) setDevices(available.filter((device) => device.kind === "audioinput"));
        })
        .catch(() => {});
      // Keep the input graph running without feeding microphone audio to the speakers.
      const source = ctx.createMediaStreamSource(input);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const mute = ctx.createGain();
      mute.gain.value = 0;
      source.connect(analyser);
      analyser.connect(mute);
      mute.connect(ctx.destination);
      const meterSamples = new Float32Array(analyser.fftSize);
      const meterTimer = setInterval(() => {
        analyser.getFloatTimeDomainData(meterSamples);
        if (mounted.current) setInputDb(signalLevel(meterSamples).db);
      }, 100);
      stopMeter.current = () => {
        clearInterval(meterTimer);
        source.disconnect();
        analyser.disconnect();
        mute.disconnect();
      };
      const capture = new MediaRecorder(input);
      recorder.current = capture;
      const chunks: Blob[] = [];
      capture.addEventListener("dataavailable", (event) => {
        if (event.data.size) chunks.push(event.data);
      });
      capture.addEventListener("error", () => {
        stopMeter.current?.();
        input.getTracks().forEach((track) => track.stop());
        if (mounted.current) {
          setError("Recording failed. Please try again.");
          setBusy(null);
          setPhase(null);
        }
      });
      capture.addEventListener("stop", async () => {
        stopMeter.current?.();
        input.getTracks().forEach((track) => track.stop());
        if (!mounted.current) return;
        setPhase("processing");
        try {
          const decoded = await ctx.decodeAudioData(await new Blob(chunks, { type: capture.mimeType }).arrayBuffer());
          const samples = new Float32Array(decoded.length);
          for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
            const data = decoded.getChannelData(channel);
            for (let i = 0; i < samples.length; i++) samples[i] += data[i] / decoded.numberOfChannels;
          }
          if (!samples.length) throw new Error("Empty recording");
          const sound = { samples, sampleRate: decoded.sampleRate };
          const level = signalLevel(samples);
          if (mounted.current) {
            // Always show the latest capture in the main waveform and spectrogram, including vowels.
            setSpeech(sound);
            setRecordingLabel(kind === "speech" ? "Recorded speech" : `Recorded ${labels[kind].toLowerCase()}`);
            setRecordingInfo(
              `${(samples.length / sound.sampleRate).toFixed(1)} s · ${sound.sampleRate.toLocaleString()} Hz · average ${level.db.toFixed(0)} dBFS`
            );
            if (kind === "ah") setAh(vowelSegment(sound));
            else if (kind === "ee") setEe(vowelSegment(sound));
            if (level.peak < 0.00001)
              setError(
                "The microphone captured silence. Check the selected input, its mute switch, and your system microphone permissions, then try again."
              );
            else if (level.db < -60)
              setError(
                "The captured audio is very quiet. Try a different microphone or increase its input volume in your system sound settings."
              );
          }
        } catch {
          if (mounted.current) setError("Could not decode the recording. Try a different browser.");
        } finally {
          if (mounted.current) {
            setBusy(null);
            setPhase(null);
          }
        }
      });
      capture.addEventListener(
        "start",
        () => {
          if (!mounted.current) return;
          setPhase("recording");
        },
        { once: true }
      );
      capture.start();
    } catch (cause) {
      stopMeter.current?.();
      stream.current?.getTracks().forEach((track) => track.stop());
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : "Microphone access failed.");
        setBusy(null);
        setPhase(null);
      }
    }
  }

  function stopRecording() {
    if (recorder.current?.state !== "recording") return;
    setPhase("processing");
    recorder.current.stop();
  }

  async function play(sound: Sound, rate = 1) {
    try {
      const ctx = await audioContext();
      player.current?.stop();
      const buffer = ctx.createBuffer(1, sound.samples.length, sound.sampleRate);
      buffer.copyToChannel(new Float32Array(sound.samples), 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      source.connect(ctx.destination);
      source.start();
      player.current = source;
    } catch {
      setError("Audio playback failed. Please try again.");
    }
  }

  const recording = speech ?? synthetic.ah;
  const vowels = [
    { label: ah ? "Recorded aah" : "Synthetic aah", sound: ah ?? synthetic.ah },
    { label: ee ? "Recorded eee" : "Synthetic eee", sound: ee ?? synthetic.ee },
  ];
  return (
    <div className="not-prose my-8 font-mallory-book text-sm text-chart-ink">
      <h3 className="font-arizona-flare text-2xl">Try it: sound as numbers</h3>
      <p className="my-2 text-xs text-chart-muted">
        Explore synthetic sounds or record your voice. Audio stays in this tab and is never uploaded.
      </p>
      <div className="my-2 flex flex-wrap gap-2">
        <label className="flex items-center gap-2 text-xs">
          Sound
          <select
            value={selectedKind}
            disabled={busy !== null}
            onChange={(event) => setSelectedKind(event.target.value as "speech" | "ah" | "ee")}
            className="min-h-8 rounded border border-chart-muted bg-background px-2 py-1"
          >
            <option value="speech">Speech</option>
            <option value="ah">Aah</option>
            <option value="ee">Eee</option>
          </select>
        </label>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void record(selectedKind)}
          className="min-h-8 cursor-pointer rounded border border-chart-muted px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start recording
        </button>
        <button
          type="button"
          disabled={phase !== "recording"}
          onClick={stopRecording}
          className="min-h-8 cursor-pointer rounded border border-chart-muted px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Stop recording
        </button>
      </div>
      {devices.length > 0 && (
        <label className="my-2 flex flex-wrap items-center gap-2 text-xs">
          Microphone
          <select
            value={deviceId}
            disabled={busy !== null}
            onChange={(event) => setDeviceId(event.target.value)}
            className="max-w-full min-w-0 rounded border border-chart-muted bg-background px-2 py-1"
          >
            <option value="">System default</option>
            {devices
              .filter((device) => device.deviceId && device.deviceId !== "default")
              .map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || "Microphone"}
                </option>
              ))}
          </select>
        </label>
      )}
      <p role="status" className="text-xs text-chart-muted">
        {phase === "requesting"
          ? "Allow microphone access. The microphone may take a few seconds to start."
          : phase === "recording"
            ? `Recording from ${inputName}. Wait for the input meter to respond, then speak. Press Stop recording when finished.`
            : phase === "processing"
              ? "Processing your recording…"
              : speech
                ? `${recordingLabel}: ${recordingInfo}`
                : "Showing a synthetic aah until you record. Any recording updates the waveform and spectrogram."}
      </p>
      {phase === "recording" && (
        <label className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          Live microphone level
          <meter min={-90} max={0} value={inputDb} className="h-3 w-32" />
          <span className="tabular-nums">{inputDb.toFixed(0)} dBFS</span>
          {phase === "recording" && inputDb <= -85 && (
            <span className="text-chart-muted">
              Waiting for audio — allow a few seconds for startup, then check your input and mute switch.
            </span>
          )}
        </label>
      )}
      {error && (
        <p role="alert" className="my-3 text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <Controls className="mt-2! gap-x-4 gap-y-1">
        <TextButton onClick={() => void play(recording)}>Play recording</TextButton>
        <TextButton onClick={() => void play(recording, 2)}>Play 2× (octave up)</TextButton>
        <TextButton
          onClick={() => {
            player.current?.stop();
            player.current = null;
          }}
        >
          Stop playback
        </TextButton>
      </Controls>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PlotPanel title="Waveform">
          <LinePlot sounds={[{ label: speech ? recordingLabel : "Synthetic aah", sound: recording }]} />
        </PlotPanel>
        <PlotPanel title="Spectrogram">
          <Spectrogram sound={recording} />
        </PlotPanel>
        <PlotPanel title="Vowel waveforms · first 30 ms">
          <LinePlot sounds={vowels} zoom />
        </PlotPanel>
        <PlotPanel title="Vowel spectra">
          <LinePlot sounds={vowels} spectrum />
        </PlotPanel>
        <PlotPanel title="Synthetic spectra">
          <LinePlot
            sounds={(["buzz", "ah", "ee"] as const).map((key) => ({ label: labels[key], sound: synthetic[key] }))}
            spectrum
          />
        </PlotPanel>
        <PlotPanel title="Build a vowel">
          <Controls className="mt-2!">
            <Slider
              label="Synthetic pitch"
              value={pitch}
              min={70}
              max={250}
              step={1}
              format={(v) => `${v} Hz`}
              onChange={setPitch}
            />
          </Controls>
          <Controls className="mt-2! gap-x-4 gap-y-1">
            {(["buzz", "ah", "ee"] as const).map((key) => (
              <TextButton key={key} onClick={() => void play(synthetic[key])}>
                Play {labels[key].toLowerCase()}
              </TextButton>
            ))}
          </Controls>
          <Controls className="mt-2! gap-x-4 gap-y-1">
            {vowels.map(({ label, sound }) => (
              <TextButton key={label} onClick={() => void play(sound)}>
                Play {label.toLowerCase()}
              </TextButton>
            ))}
          </Controls>
        </PlotPanel>
      </div>
      <details className="mt-3 text-xs text-chart-muted">
        <summary className="cursor-pointer">How to read the plots</summary>
        <div className="mt-2 space-y-2 leading-relaxed">
          <p>
            Each plot uses the actual recording sample rate. Vowel recordings use 200 ms from the steady middle; the
            waveform shows the first 30 ms. Repeating shapes reveal pitch, while their shape contributes to timbre.
          </p>
          <p>
            Spectra use a Hann window and show −60 to 0 dB, relative to each sound’s strongest frequency, up to 4,000
            Hz.
          </p>
          <p>
            Synthetic vowels combine 40 harmonics with strength 1/n. Formants boost 700 and 1,200 Hz for “aah”, and 300
            and 2,300 Hz for “eee”. Changing pitch moves the harmonics, not the formants.
          </p>
          <p>
            The spectrogram uses overlapping 2,048-sample Hann windows with a 512-sample hop. Colours show level
            relative to the strongest frequency across the whole recording.
          </p>
        </div>
      </details>
    </div>
  );
}
