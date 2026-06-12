"use client";
import dynamic from "next/dynamic";

// Quill uses browser APIs (document/window) — must never run on server
const TextEditorClient = dynamic(() => import("./TextEditorClient"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: 300,
        border: "1px solid #ccc",
        borderRadius: 4,
        background: "#fafafa",
      }}
    />
  ),
});

export default TextEditorClient;
