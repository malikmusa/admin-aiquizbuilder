/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import TablePicker from "./TablePicker";
import { useQuillEditor } from "./useQuillEditor";

export default function TextEditorClient({
  setForm,
  value,
}: {
  setForm: (form: any) => void;
  value?: string;
}) {
  const { containerRef, picker, setPicker, insertTable } = useQuillEditor({
    value,
    setForm,
  });

  return (
    <div>
      <div ref={containerRef} style={{ minHeight: 300 }} />
      {picker && (
        <TablePicker
          top={picker.top}
          left={picker.left}
          onSelect={insertTable}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
