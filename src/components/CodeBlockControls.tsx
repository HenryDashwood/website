"use client";

import { RefObject, useCallback, useEffect, useState } from "react";

interface CodeBlockControlsProps {
  figureRef: RefObject<HTMLElement | null>;
}

function fallbackCopyText(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textArea);
  }
  return copied;
}

export default function CodeBlockControls({ figureRef }: CodeBlockControlsProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    const codeText = figureRef.current?.querySelector("pre code")?.textContent || "";
    if (!codeText) return;

    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      return;
    } catch {
      if (fallbackCopyText(codeText)) {
        setCopied(true);
      }
    }
  }, [figureRef]);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  return (
    <button type="button" className="copy-code-button not-prose" onClick={onCopy} aria-live="polite" title="Copy code">
      <span className="sr-only">{copied ? "Copied" : "Copy code"}</span>
      {copied ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M9 16.2 4.8 12l1.4-1.4L9 13.4l8.8-8.8L19.2 6z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m0 16H10V7h9z"
          />
        </svg>
      )}
    </button>
  );
}
