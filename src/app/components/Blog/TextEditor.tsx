"use client";
import dynamic from "next/dynamic";

// Quill uses browser APIs (document/window) — must never run on server
const TextEditorClient = dynamic(() => import("./TextEditorClient"), {
  ssr: false,
  loading: () => <div />,
});

export default TextEditorClient;
