"use client";
import { useState } from "react";

const MAX = 10;

interface Props {
  top: number;
  left: number;
  onSelect: (rows: number, cols: number) => void;
  onClose: () => void;
}

export default function TablePicker({ top, left, onSelect, onClose }: Props) {
  const [hov, setHov] = useState({ r: 0, c: 0 });

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top,
          left,
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 4,
          padding: 8,
          boxShadow: "0 2px 10px rgba(0,0,0,.18)",
          zIndex: 9999,
          userSelect: "none",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#888",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          {hov.r > 0 ? `${hov.r} × ${hov.c}` : "Select table size"}
        </div>
        {Array.from({ length: MAX }).map((_, r) => (
          <div key={r} style={{ display: "flex" }}>
            {Array.from({ length: MAX }).map((_, c) => (
              <div
                key={c}
                onMouseEnter={() => setHov({ r: r + 1, c: c + 1 })}
                onClick={() => onSelect(r + 1, c + 1)}
                style={{
                  width: 16,
                  height: 16,
                  margin: 1,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: r < hov.r && c < hov.c ? "#1677ff" : "#ddd",
                  background: r < hov.r && c < hov.c ? "#e6f4ff" : "#fff",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
