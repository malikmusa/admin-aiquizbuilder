"use client";
import { useEffect, useRef, useState } from "react";

interface EditorButton {
  label: string;
  icon: string;
  command: string;
  value?: string;
  title: string;
}

const TOOLBAR: EditorButton[][] = [
  [
    { label: "B", icon: "<b>B</b>", command: "bold", title: "Bold (Ctrl+B)" },
    {
      label: "I",
      icon: "<i>I</i>",
      command: "italic",
      title: "Italic (Ctrl+I)",
    },
    {
      label: "U",
      icon: "<u>U</u>",
      command: "underline",
      title: "Underline (Ctrl+U)",
    },
    {
      label: "S",
      icon: "<s>S</s>",
      command: "strikeThrough",
      title: "Strikethrough",
    },
  ],
  [
    {
      label: "H1",
      icon: "H1",
      command: "formatBlock",
      value: "h1",
      title: "Heading 1",
    },
    {
      label: "H2",
      icon: "H2",
      command: "formatBlock",
      value: "h2",
      title: "Heading 2",
    },
    {
      label: "H3",
      icon: "H3",
      command: "formatBlock",
      value: "h3",
      title: "Heading 3",
    },
    {
      label: "P",
      icon: "¶",
      command: "formatBlock",
      value: "p",
      title: "Paragraph",
    },
  ],
  [
    {
      label: "UL",
      icon: "≡",
      command: "insertUnorderedList",
      title: "Bullet List",
    },
    {
      label: "OL",
      icon: "①",
      command: "insertOrderedList",
      title: "Numbered List",
    },
    {
      label: "Quote",
      icon: "❝",
      command: "formatBlock",
      value: "blockquote",
      title: "Blockquote",
    },
    {
      label: "Code",
      icon: "</>",
      command: "formatBlock",
      value: "pre",
      title: "Code Block",
    },
  ],
  [
    { label: "Left", icon: "⬅", command: "justifyLeft", title: "Align Left" },
    { label: "Center", icon: "↔", command: "justifyCenter", title: "Center" },
    {
      label: "Right",
      icon: "➡",
      command: "justifyRight",
      title: "Align Right",
    },
  ],
  [
    {
      label: "HR",
      icon: "—",
      command: "insertHorizontalRule",
      title: "Horizontal Rule",
    },
    {
      label: "Clear",
      icon: "✕",
      command: "removeFormat",
      title: "Clear Formatting",
    },
  ],
];

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const isComposing = useRef(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const updateStats = (el: HTMLDivElement) => {
    const text = el.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  const updateActiveFormats = () => {
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("strikeThrough"))
      formats.add("strikeThrough");
    if (document.queryCommandState("insertUnorderedList"))
      formats.add("insertUnorderedList");
    if (document.queryCommandState("insertOrderedList"))
      formats.add("insertOrderedList");
    if (document.queryCommandState("justifyLeft")) formats.add("justifyLeft");
    if (document.queryCommandState("justifyCenter"))
      formats.add("justifyCenter");
    if (document.queryCommandState("justifyRight")) formats.add("justifyRight");
    setActiveFormats(formats);
  };

  const execCmd = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateActiveFormats();
    }
  };

  const handleInput = () => {
    if (isComposing.current) return;
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateStats(editorRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const isActive = (btn: EditorButton) => {
    if (btn.value) return false;
    return activeFormats.has(btn.command);
  };

  return (
    <div className="rte-root">
      <div className="rte-toolbar">
        {TOOLBAR.map((group, gi) => (
          <div key={gi} className="rte-group">
            {group.map((btn) => (
              <button
                key={btn.label}
                type="button"
                title={btn.title}
                className={`rte-btn${isActive(btn) ? " rte-btn--active" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  execCmd(btn.command, btn.value);
                }}
                dangerouslySetInnerHTML={{ __html: btn.icon }}
              />
            ))}
            {gi < TOOLBAR.length - 1 && <span className="rte-divider" />}
          </div>
        ))}
      </div>

      <div
        ref={editorRef}
        className="rte-body"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onPaste={handlePaste}
        onCompositionStart={() => (isComposing.current = true)}
        onCompositionEnd={() => {
          isComposing.current = false;
          handleInput();
        }}
        data-placeholder="Write the full article here…"
      />

      <div className="rte-footer">
        <span>
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
        <span>
          {charCount} {charCount === 1 ? "character" : "characters"}
        </span>
      </div>
    </div>
  );
}