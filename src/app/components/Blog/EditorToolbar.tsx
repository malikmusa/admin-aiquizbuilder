"use client";
import React from "react";
import { MAX_GRID } from "./tableUtils";

// ─── Tiny toolbar button ──────────────────────────────────────────────────────
function TB({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="p-1 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center"
      style={{ minWidth: 26, minHeight: 26 }}
    >
      {children}
    </button>
  );
}

const Sep = () => (
  <span className="w-px h-5 bg-gray-300 mx-0.5 inline-block shrink-0" />
);

// ─── Props ────────────────────────────────────────────────────────────────────
interface ToolbarProps {
  exec: (cmd: string, val?: string) => void;
  blockFmt: string;
  insertLink: () => void;
  insertImage: () => void;
  showPicker: boolean;
  setShowPicker: (v: boolean) => void;
  hovered: { rows: number; cols: number };
  setHovered: (v: { rows: number; cols: number }) => void;
  pickerPos: { top: number; right: number };
  setPickerPos: (v: { top: number; right: number }) => void;
  insertTable: (rows: number, cols: number) => void;
  wrapperRef: React.RefObject<HTMLDivElement>;
  pickerRef: React.RefObject<HTMLDivElement>;
  tableBtnRef: React.RefObject<HTMLButtonElement>;
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────
export default function EditorToolbar({
  exec, blockFmt, insertLink, insertImage,
  showPicker, setShowPicker, hovered, setHovered,
  pickerPos, setPickerPos, insertTable,
  wrapperRef, pickerRef, tableBtnRef,
}: ToolbarProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        {/* Block format */}
        <select
          className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700 focus:outline-none"
          value={blockFmt}
          onChange={(e) => exec("formatBlock", e.target.value || "p")}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <Sep />

        <TB title="Bold" onClick={() => exec("bold")}><b style={{ fontSize: 13 }}>B</b></TB>
        <TB title="Italic" onClick={() => exec("italic")}><i style={{ fontSize: 13 }}>I</i></TB>
        <TB title="Underline" onClick={() => exec("underline")}><u style={{ fontSize: 12 }}>U</u></TB>
        <TB title="Strikethrough" onClick={() => exec("strikeThrough")}><s style={{ fontSize: 12 }}>S</s></TB>

        <Sep />

        <TB title="Align left" onClick={() => exec("justifyLeft")}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <rect x="2" y="3" width="14" height="2" /><rect x="2" y="7" width="9" height="2" />
            <rect x="2" y="11" width="14" height="2" /><rect x="2" y="15" width="9" height="2" />
          </svg>
        </TB>
        <TB title="Align center" onClick={() => exec("justifyCenter")}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <rect x="2" y="3" width="14" height="2" /><rect x="4.5" y="7" width="9" height="2" />
            <rect x="2" y="11" width="14" height="2" /><rect x="4.5" y="15" width="9" height="2" />
          </svg>
        </TB>
        <TB title="Align right" onClick={() => exec("justifyRight")}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <rect x="2" y="3" width="14" height="2" /><rect x="7" y="7" width="9" height="2" />
            <rect x="2" y="11" width="14" height="2" /><rect x="7" y="15" width="9" height="2" />
          </svg>
        </TB>

        <Sep />

        <TB title="Ordered list" onClick={() => exec("insertOrderedList")}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <path d="M1 4h2v1H2v.5h1v1H1V4zm0 5V8h1v-.5H1V7h2v1.5H2V9h1v1H1zm0 5h2v.5H2v.5h1v1H1v-1h1v-.5H1v-1zM5 4.5h12v1.5H5V4.5zm0 5h12V8H5v1.5zm0 5.5h12v-1.5H5V15z" />
          </svg>
        </TB>
        <TB title="Bullet list" onClick={() => exec("insertUnorderedList")}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <circle cx="2.5" cy="5" r="1.5" /><rect x="6" y="4" width="10" height="2" />
            <circle cx="2.5" cy="9.5" r="1.5" /><rect x="6" y="8.5" width="10" height="2" />
            <circle cx="2.5" cy="14" r="1.5" /><rect x="6" y="13" width="10" height="2" />
          </svg>
        </TB>

        <Sep />

        <TB title="Indent" onClick={() => exec("indent")}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <rect x="2" y="3" width="14" height="1.5" /><rect x="6" y="7" width="10" height="1.5" />
            <rect x="6" y="11" width="10" height="1.5" /><rect x="2" y="15" width="14" height="1.5" />
            <path d="M2 8.5 5.5 10.5 2 12.5z" />
          </svg>
        </TB>
        <TB title="Outdent" onClick={() => exec("outdent")}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <rect x="2" y="3" width="14" height="1.5" /><rect x="6" y="7" width="10" height="1.5" />
            <rect x="6" y="11" width="10" height="1.5" /><rect x="2" y="15" width="14" height="1.5" />
            <path d="M6 8.5 2.5 10.5 6 12.5z" />
          </svg>
        </TB>

        <Sep />

        <TB title="Insert link" onClick={insertLink}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <path d="M7.2 12.9 5.6 11.3a4 4 0 010-5.7L7.2 7a2 2 0 000 2.8l1.6 1.6a4 4 0 01-1.6.5zm3.6-6.7L12.4 7.8a4 4 0 010 5.7L10.8 12a2 2 0 000-2.8L9.2 7.6a4 4 0 011.6-.4zm-5 5.2 5-5 .7.7-5 5-.7-.7z" />
          </svg>
        </TB>
        <TB title="Insert image" onClick={insertImage}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <path d="M17 3H1a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1zM2 13V5h14v8zm2.5-3 2-2.5 2 2.5 2.5-3L13 13H4l.5-3z" />
            <circle cx="5.5" cy="7.5" r="1" />
          </svg>
        </TB>

        <Sep />

        <label title="Text color" className="cursor-pointer p-1 rounded hover:bg-gray-200 text-gray-700 flex items-center" style={{ minWidth: 26, minHeight: 26 }}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <path d="M9 2 4.5 14h2l1-2.5h3L11.5 14h2L9 2zm-1 8 1.5-4 1.5 4H8z" />
          </svg>
          <input type="color" className="sr-only" onChange={(e) => exec("foreColor", e.target.value)} />
        </label>
        <label title="Highlight color" className="cursor-pointer p-1 rounded hover:bg-gray-200 text-gray-700 flex items-center" style={{ minWidth: 26, minHeight: 26 }}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <path d="M9 1.5 3 11h12L9 1.5zM1.5 14h15v2h-15z" />
          </svg>
          <input type="color" className="sr-only" onChange={(e) => exec("backColor", e.target.value)} />
        </label>

        <Sep />

        <TB title="Clear formatting" onClick={() => exec("removeFormat")}>
          <svg viewBox="0 0 18 18" width="13" height="13" fill="currentColor">
            <path d="M3 3h8l-1.5 4H8L6 3H3zm5 5 4 7h-2l-1-2H5l-1 2H2l4-7h2zm-1 2-1 2h2l-1-2z" />
            <line x1="14" y1="3" x2="18" y2="15" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </TB>

        <Sep />

        {/* Table button */}
        <button
          ref={tableBtnRef}
          type="button"
          title="Insert table"
          onMouseDown={(e) => {
            e.preventDefault();
            const rect = tableBtnRef.current!.getBoundingClientRect();
            const wr = wrapperRef.current!.getBoundingClientRect();
            setPickerPos({ top: rect.bottom - wr.top + 4, right: wr.right - rect.right });
            setShowPicker(!showPicker);
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-700 flex items-center justify-center"
          style={{ minWidth: 26, minHeight: 26 }}
        >
          <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="16" height="4" />
            <rect x="1" y="5" width="8" height="4" />
            <rect x="9" y="5" width="8" height="4" />
            <rect x="1" y="9" width="8" height="5" />
            <rect x="9" y="9" width="8" height="5" />
          </svg>
        </button>
      </div>

      {/* Table size picker */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
          style={{ top: pickerPos.top, right: pickerPos.right }}
        >
          <p className="text-xs text-gray-500 mb-2">
            {hovered.rows > 0 ? `${hovered.rows} × ${hovered.cols} table` : "Select table size"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${MAX_GRID}, 1.25rem)`, gap: "2px" }}>
            {Array.from({ length: MAX_GRID * MAX_GRID }, (_, i) => {
              const r = Math.floor(i / MAX_GRID) + 1;
              const c = (i % MAX_GRID) + 1;
              return (
                <div
                  key={i}
                  style={{ width: "1.25rem", height: "1.25rem" }}
                  className={`border cursor-pointer transition-colors ${
                    r <= hovered.rows && c <= hovered.cols
                      ? "bg-blue-200 border-blue-400"
                      : "bg-gray-50 border-gray-200"
                  }`}
                  onMouseEnter={() => setHovered({ rows: r, cols: c })}
                  onClick={() => insertTable(r, c)}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
