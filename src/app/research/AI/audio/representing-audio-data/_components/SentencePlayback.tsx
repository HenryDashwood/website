"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";

export function useSentencePlayback(duration: number) {
  const audio = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    let frame = requestAnimationFrame(tick);
    function tick() {
      setTime(audio.current?.currentTime ?? 0);
      frame = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  function seek(event: MouseEvent<SVGRectElement>) {
    const el = audio.current;
    const box = event.currentTarget.getBoundingClientRect();
    if (!el || !duration || !box.width) return;
    el.currentTime = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)) * duration;
    setTime(el.currentTime);
  }

  return { audio, duration, playing, setPlaying, time, setTime, seek };
}

export function SentencePlayback({
  src,
  playback: { audio, duration, playing, setPlaying, time, setTime },
  label,
}: {
  src: string;
  playback: ReturnType<typeof useSentencePlayback>;
  label?: string;
}) {
  function toggle() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  return (
    <>
      <audio
        ref={audio}
        src={src}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={(event) => {
          setPlaying(false);
          setTime(event.currentTarget.currentTime);
        }}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
      />
      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={`${playing ? "Pause" : "Play"}${label ? ` ${label}` : ""}`}
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-chart-series-1 text-white hover:opacity-85"
        >
          <svg viewBox="0 0 16 16" className="size-3 fill-current" aria-hidden="true">
            {playing ? <path d="M3 2h3.5v12H3zM9.5 2H13v12h-3.5z" /> : <path d="M4 1.5v13L14 8z" />}
          </svg>
        </button>
        <p className="min-w-0 flex-1 font-source-serif text-[15px] text-chart-ink italic">
          “A microphone measures air pressure thousands of times every second.”
        </p>
        <span className="shrink-0 font-mallory-book text-xs text-chart-muted tabular-nums">
          {time.toFixed(2)} / {duration.toFixed(2)} s
        </span>
      </div>
    </>
  );
}
