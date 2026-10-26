"use client";

import type { CSSProperties, ReactNode } from "react";

export type Tone = "ink" | "series-1" | "series-2";

const toneText: Record<Tone, string> = {
  ink: "text-chart-ink",
  "series-1": "text-chart-series-1",
  "series-2": "text-chart-series-2",
};

// Italic serif for maths symbols in labels, lighter than KaTeX at small sizes
export function Sym({ children }: { children: ReactNode }) {
  return <span className="font-martina-plantijn text-[1.08em] italic">{children}</span>;
}

// Builds an SVG path; a null point lifts the pen so out-of-range stretches are skipped
export function toPath(points: Array<[number, number] | null>) {
  let d = "";
  let pen = false;
  for (const p of points) {
    if (!p) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
    pen = true;
  }
  return d;
}

// A chart, a quiet row of controls and a caption, sitting directly on the page
export function Figure({ children, caption }: { children: ReactNode; caption: ReactNode }) {
  return (
    <figure className="not-prose mx-0 my-10">
      {children}
      <figcaption className="mt-4 font-martina-plantijn text-[15px] leading-normal text-chart-muted italic">
        {caption}
      </figcaption>
    </figure>
  );
}

export function Chart({
  width,
  height,
  label,
  children,
}: {
  width: number;
  height: number;
  label: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block h-auto w-full overflow-visible"
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  tone = "ink",
  onChange,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  tone?: Tone;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col" style={{ "--thumb": `var(--color-chart-${tone})` } as CSSProperties}>
      <span className="flex justify-between gap-2">
        <span>{label}</span>
        <span className={`tabular-nums ${toneText[tone]}`}>{format(value)}</span>
      </span>
      <input
        type="range"
        className="viz-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

export function Controls({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mt-5 flex flex-wrap items-end gap-x-7 gap-y-2 font-mallory-book text-xs text-chart-muted [&>label]:min-w-40 [&>label]:flex-1 ${className}`}
    >
      {children}
    </div>
  );
}

// Underlined text button for presets and view toggles; the active one gets the site's amber underline
export function TextButton({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-7 cursor-pointer font-mallory-book text-[13px] underline-offset-4 hover:text-chart-ink hover:underline ${
        active ? "text-chart-ink underline decoration-nav-background decoration-2" : "text-chart-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function GroupHeading({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`mb-0.5 text-[11px] font-bold tracking-wider uppercase ${toneText[tone]}`}>{children}</span>;
}

// Left and bottom axis lines
export function Axes({ left, top, right, bottom }: { left: number; top: number; right: number; bottom: number }) {
  return (
    <g className="stroke-chart-ink" strokeOpacity={0.55} strokeWidth={1}>
      <line x1={left} y1={top} x2={left} y2={bottom} />
      <line x1={left} y1={bottom} x2={right} y2={bottom} />
    </g>
  );
}

// Equilibrium and highlighted points: an ink dot with a ring in the page colour
export function Point({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={4.5} className="fill-chart-ink stroke-background" strokeWidth={2} />;
}
