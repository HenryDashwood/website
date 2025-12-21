"use client";

import { useEffect, useRef } from "react";

interface EditorComponentProps {
  markdown: string;
  onChange: (value: string) => void;
}

export default function EditorComponent({ markdown, onChange }: EditorComponentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Insert text at cursor position
  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = markdown.slice(0, start) + text + markdown.slice(end);
    onChange(newValue);

    // Restore cursor position after the inserted text
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    });
  };

  const insertDetails = () => {
    insertAtCursor(`<details>
<summary>Click to expand</summary>

Content goes here...

</details>`);
  };

  const insertMath = () => {
    insertAtCursor(`$$
E = mc^2
$$`);
  };

  const insertLocalImage = () => {
    insertAtCursor(`<LocalImage 
  src="/images/your-image.png" 
  alt="Description of image"
  caption="Optional caption"
  size="large"
/>`);
  };

  // Handle tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      insertAtCursor("  ");
    }
  };

  // Sync scroll position (optional enhancement)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.value = markdown;
    }
  }, [markdown]);

  return (
    <div ref={containerRef} className="flex h-full min-h-[calc(100vh-200px)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1">
        <ToolbarButton onClick={insertDetails} title="Insert Details/Summary block">
          <ChevronIcon />
          <span className="ml-1 text-xs">Details</span>
        </ToolbarButton>
        <ToolbarButton onClick={insertMath} title="Insert Math block (LaTeX)">
          <span className="font-serif">∑</span>
          <span className="ml-1 text-xs">Math</span>
        </ToolbarButton>
        <ToolbarButton onClick={insertLocalImage} title="Insert LocalImage component">
          <ImageIcon />
          <span className="ml-1 text-xs">Image</span>
        </ToolbarButton>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={markdown}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 resize-none bg-gray-900 p-4 font-mono text-sm text-gray-100 focus:outline-none"
        placeholder="Start writing your MDX..."
        spellCheck={false}
      />
    </div>
  );
}

// Toolbar button component
function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
    >
      {children}
    </button>
  );
}

// Icons
function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
