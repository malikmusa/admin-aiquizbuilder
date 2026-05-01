/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useRef } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

export default function TextEditor({
  setForm,
  value,
}: {
  setForm: (form: any) => void;
  value?: string;
}) {
  const { quill, quillRef } = useQuill({
    theme: "snow",
  });

  const isInitialized = useRef(false);

  // ✅ Set initial value (ONLY once)
  useEffect(() => {
    if (quill && value && !isInitialized.current) {
      quill.clipboard.dangerouslyPasteHTML(value);
      isInitialized.current = true;
    }
  }, [quill, value]);

  useEffect(() => {
    if (!quill) return;

    const handler = () => {
      setForm((prev: any) => ({
        ...prev,
        content: quill.root.innerHTML,
      }));
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [quill]);

  return (
    <div className="border-1  border-[#0000] !rounded-xl ">
      <div ref={quillRef as any} className="h-[300px] overflow-hidden " />
    </div>
  );
}
