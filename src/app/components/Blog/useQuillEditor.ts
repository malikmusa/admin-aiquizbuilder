/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import QuillTableBetter from "quill-table-better";

// Register once at module scope — adds table blots to Quill's globalRegistry
Quill.register({ "modules/table-better": QuillTableBetter }, true);

// Identical to react-quilljs default toolbar + table-better at the end
const TOOLBAR = [
  ["bold", "italic", "underline", "strike"],
  [{ align: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ["link", "image", "video"],
  [{ color: [] }, { background: [] }],
  ["clean"],
  ["table-better"],
];

// quill-table-better requires updateContents (not setContents/dangerouslyPasteHTML)
// to correctly render tables on initial load
function loadContent(quill: Quill, html: string) {
  const delta = quill.clipboard.convert({ html });
  const [range] = quill.selection.getRange();
  quill.updateContents(delta, Quill.sources.USER);
  quill.setSelection(delta.length() - (range?.length ?? 0), Quill.sources.SILENT);
  quill.scrollSelectionIntoView();
  quill.root.classList.remove("ql-blank");
}

interface Options {
  value?: string;
  setForm: (fn: any) => void;
}

export function useQuillEditor({ value, setForm }: Options) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isInit = useRef(false);
  const savedRange = useRef({ index: 0, length: 0 });
  const setFormRef = useRef(setForm);
  setFormRef.current = setForm;
  const valueRef = useRef(value);
  valueRef.current = value;

  const [picker, setPicker] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || quillRef.current) return;

    const quill = new Quill(container, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR,
        table: false,
        "table-better": {
          language: "en_US",
          menus: ["column", "row", "merge", "table", "cell", "wrap", "delete"],
          toolbarTable: true,
        },
        keyboard: { bindings: QuillTableBetter.keyboardBindings },
        clipboard: { matchVisual: false },
      },
      // No `formats` → uses globalRegistry which includes all table blots
    });

    quillRef.current = quill;

    // Ensure readable dark text regardless of system dark-mode CSS inheritance
    quill.root.style.color = "#111827";

    // Load initial value — covers both StrictMode runs via valueRef
    // Use updateContents (not dangerouslyPasteHTML) so tables render correctly
    if (valueRef.current && !isInit.current) {
      loadContent(quill, valueRef.current);
      isInit.current = true;
    }

    quill.on("selection-change", (range) => {
      if (range) savedRange.current = { index: range.index, length: range.length };
    });

    quill.on("text-change", () => {
      setFormRef.current((p: any) => ({ ...p, content: quill.root.innerHTML }));
    });

    // Replace built-in table picker with our fixed-position React one
    const toolbarEl = (quill.getModule("toolbar") as any)?.container as HTMLElement | undefined;
    const btn = toolbarEl?.querySelector("button.ql-table-better") as HTMLElement | null;
    if (btn) {
      const builtIn = btn.querySelector(".ql-table-select-container") as HTMLElement | null;
      if (builtIn) builtIn.style.display = "none";
      btn.addEventListener(
        "click",
        (e) => {
          e.stopPropagation();
          const rect = btn.getBoundingClientRect();
          setPicker((p) => (p ? null : { top: rect.bottom + 6, left: rect.left }));
        },
        true
      );
    }

    return () => {
      // Remove toolbar DOM sibling — prevents double toolbar on StrictMode re-mount
      const toolbar = (quill.getModule("toolbar") as any)?.container as HTMLElement | null;
      if (toolbar?.parentNode) toolbar.parentNode.removeChild(toolbar);
      quill.off("text-change");
      quill.off("selection-change");
      container.innerHTML = "";
      container.className = "";
      quillRef.current = null;
      isInit.current = false;
    };
  }, []);

  // Fallback: value arrives after init (async fetch in edit flow)
  useEffect(() => {
    const quill = quillRef.current;
    if (quill && value && !isInit.current) {
      loadContent(quill, value);
      isInit.current = true;
    }
  }, [value]);

  function insertTable(rows: number, cols: number) {
    setPicker(null);
    const { index, length } = savedRange.current;
    // Defer until after React removes the picker from DOM
    setTimeout(() => {
      const quill = quillRef.current;
      if (!quill) return;
      quill.focus();
      quill.setSelection(index, length);
      (quill.getModule("table-better") as any)?.insertTable(rows, cols);
    }, 0);
  }

  return { containerRef, picker, setPicker, insertTable };
}
