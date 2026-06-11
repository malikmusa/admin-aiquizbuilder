/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import EditorToolbar from "./EditorToolbar";
import { TD_STYLE, genRowId, makeTableHtml } from "./tableUtils";

interface CtxMenu {
  x: number;
  y: number;
  td: HTMLTableCellElement;
  tr: HTMLTableRowElement;
  table: HTMLTableElement;
}

export default function TextEditor({
  setForm,
  value,
}: {
  setForm: (f: any) => void;
  value?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<HTMLDivElement>(null);
  const tableBtnRef = useRef<HTMLButtonElement>(null);
  const isInit = useRef(false);

  const [showPicker, setShowPicker] = useState(false);
  const [hovered, setHovered] = useState({ rows: 0, cols: 0 });
  const [pickerPos, setPickerPos] = useState({ top: 0, right: 0 });
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [blockFmt, setBlockFmt] = useState("");

  // Sync innerHTML → parent form
  const sync = useCallback(() => {
    if (editorRef.current)
      setForm((p: any) => ({ ...p, content: editorRef.current!.innerHTML }));
  }, [setForm]);

  // Load existing value (edit flow)
  useEffect(() => {
    if (editorRef.current && value && !isInit.current) {
      editorRef.current.innerHTML = value;
      isInit.current = true;
    }
  }, [value]);

  const refreshFmt = useCallback(() => {
    const v = document.queryCommandValue("formatBlock").toLowerCase();
    setBlockFmt(["h1", "h2", "h3"].includes(v) ? v : "");
  }, []);

  const exec = useCallback(
    (cmd: string, val = "") => {
      editorRef.current?.focus();
      document.execCommand(cmd, false, val);
      sync();
      refreshFmt();
    },
    [sync, refreshFmt]
  );

  const insertTable = useCallback(
    (rows: number, cols: number) => {
      setShowPicker(false);
      setHovered({ rows: 0, cols: 0 });
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, makeTableHtml(rows, cols) + "<p><br></p>");
      sync();
    },
    [sync]
  );

  const insertLink = useCallback(() => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  }, [exec]);

  const insertImage = useCallback(() => {
    const url = prompt("Enter image URL:");
    if (url) {
      editorRef.current?.focus();
      document.execCommand("insertImage", false, url);
      sync();
    }
  }, [sync]);

  // Right-click context menu inside <td>
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const onCtx = (e: MouseEvent) => {
      const td = (e.target as Element).closest("td") as HTMLTableCellElement | null;
      if (!td) { setCtxMenu(null); return; }
      e.preventDefault();
      const tr = td.parentElement as HTMLTableRowElement;
      const table = tr.closest("table") as HTMLTableElement;
      const wr = wrapperRef.current!.getBoundingClientRect();
      setCtxMenu({ x: e.clientX - wr.left, y: e.clientY - wr.top, td, tr, table });
    };
    el.addEventListener("contextmenu", onCtx);
    return () => el.removeEventListener("contextmenu", onCtx);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (showPicker && pickerRef.current && !pickerRef.current.contains(e.target as Node) && e.target !== tableBtnRef.current)
        setShowPicker(false);
      if (ctxMenu && ctxRef.current && !ctxRef.current.contains(e.target as Node))
        setCtxMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showPicker, ctxMenu]);

  // ── Table structural operations ───────────────────────────────────────────
  const addRowAbove = useCallback((tr: HTMLTableRowElement, table: HTMLTableElement) => {
    const rid = genRowId();
    const idx = Array.from(table.tBodies[0].rows).indexOf(tr);
    const row = table.tBodies[0].insertRow(idx);
    for (let c = 0; c < tr.cells.length; c++) {
      const td = row.insertCell(c);
      td.setAttribute("data-row", rid);
      td.style.cssText = TD_STYLE;
      td.innerHTML = "<br>";
    }
    setCtxMenu(null); sync();
  }, [sync]);

  const addRowBelow = useCallback((tr: HTMLTableRowElement, table: HTMLTableElement) => {
    const rid = genRowId();
    const idx = Array.from(table.tBodies[0].rows).indexOf(tr);
    const row = table.tBodies[0].insertRow(idx + 1);
    for (let c = 0; c < tr.cells.length; c++) {
      const td = row.insertCell(c);
      td.setAttribute("data-row", rid);
      td.style.cssText = TD_STYLE;
      td.innerHTML = "<br>";
    }
    setCtxMenu(null); sync();
  }, [sync]);

  const addColLeft = useCallback((td: HTMLTableCellElement, table: HTMLTableElement) => {
    const ci = td.cellIndex;
    Array.from(table.tBodies[0].rows).forEach((row) => {
      const rid = row.cells[0]?.getAttribute("data-row") ?? genRowId();
      const newTd = row.insertCell(ci);
      newTd.setAttribute("data-row", rid);
      newTd.style.cssText = TD_STYLE;
      newTd.innerHTML = "<br>";
    });
    setCtxMenu(null); sync();
  }, [sync]);

  const addColRight = useCallback((td: HTMLTableCellElement, table: HTMLTableElement) => {
    const ci = td.cellIndex + 1;
    Array.from(table.tBodies[0].rows).forEach((row) => {
      const rid = row.cells[0]?.getAttribute("data-row") ?? genRowId();
      const newTd = row.insertCell(ci);
      newTd.setAttribute("data-row", rid);
      newTd.style.cssText = TD_STYLE;
      newTd.innerHTML = "<br>";
    });
    setCtxMenu(null); sync();
  }, [sync]);

  const deleteRow = useCallback((tr: HTMLTableRowElement, table: HTMLTableElement) => {
    if (table.rows.length <= 1) table.remove(); else tr.remove();
    setCtxMenu(null); sync();
  }, [sync]);

  const deleteCol = useCallback((td: HTMLTableCellElement, table: HTMLTableElement) => {
    if ((table.rows[0]?.cells.length ?? 0) <= 1) table.remove();
    else Array.from(table.tBodies[0].rows).forEach((r) => r.deleteCell(td.cellIndex));
    setCtxMenu(null); sync();
  }, [sync]);

  const deleteTable = useCallback((table: HTMLTableElement) => {
    table.remove(); setCtxMenu(null); sync();
  }, [sync]);

  const ctxActions = ctxMenu
    ? [
        { label: "Add row above",    fn: () => addRowAbove(ctxMenu.tr, ctxMenu.table) },
        { label: "Add row below",    fn: () => addRowBelow(ctxMenu.tr, ctxMenu.table) },
        { label: "Add column left",  fn: () => addColLeft(ctxMenu.td, ctxMenu.table) },
        { label: "Add column right", fn: () => addColRight(ctxMenu.td, ctxMenu.table) },
        { label: "—", fn: null },
        { label: "Delete row",    fn: () => deleteRow(ctxMenu.tr, ctxMenu.table),   danger: true },
        { label: "Delete column", fn: () => deleteCol(ctxMenu.td, ctxMenu.table),   danger: true },
        { label: "Delete table",  fn: () => deleteTable(ctxMenu.table),             danger: true },
      ]
    : [];

  return (
    <div ref={wrapperRef} className="relative border border-gray-200 rounded-xl overflow-hidden bg-white">
      <EditorToolbar
        exec={exec}
        blockFmt={blockFmt}
        insertLink={insertLink}
        insertImage={insertImage}
        showPicker={showPicker}
        setShowPicker={setShowPicker}
        hovered={hovered}
        setHovered={setHovered}
        pickerPos={pickerPos}
        setPickerPos={setPickerPos}
        insertTable={insertTable}
        wrapperRef={wrapperRef as React.RefObject<HTMLDivElement>}
        pickerRef={pickerRef as React.RefObject<HTMLDivElement>}
        tableBtnRef={tableBtnRef as React.RefObject<HTMLButtonElement>}
      />

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="ce-editor focus:outline-none"
        style={{ minHeight: 260, maxHeight: 420, overflowY: "auto", padding: "12px 15px", lineHeight: 1.6, fontSize: 14 }}
        onInput={sync}
        onKeyUp={refreshFmt}
        onMouseUp={refreshFmt}
      />

      {/* Right-click context menu */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[170px]"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
        >
          {ctxActions.map(({ label, fn, danger }, idx) =>
            label === "—" ? (
              <div key={idx} className="my-1 border-t border-gray-100" />
            ) : (
              <button
                key={label}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); fn?.(); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
