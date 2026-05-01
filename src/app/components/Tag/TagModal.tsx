/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useRef, useState } from "react";

interface Tag {
  id: string;
  name: string;
}

function CreateTagModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (tag: Tag) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Tag name is required."); return; }
    if (trimmed.length < 2) { setError("Must be at least 2 characters."); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Failed to create tag.");
      }

      const created: Tag = await res.json();
      onCreate(created);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="ccm-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ccm-card" role="dialog" aria-modal="true" aria-labelledby="ctm-title">

        <div className="ccm-header">
          <div>
            <p className="ccm-eyebrow">Taxonomy</p>
            <h2 className="ccm-title" id="ctm-title">New Tag</h2>
          </div>
          <button className="ccm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ccm-body">
          <div className="ccm-field">
            <label className="ccm-label" htmlFor="ctm-name-input">
              Tag Name <span className="req">*</span>
            </label>
            <input
              id="ctm-name-input"
              ref={inputRef}
              className={`ccm-input${error ? " ccm-input--error" : ""}`}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. React, Design, Tutorial…"
              onKeyDown={(e) => e.key === "Enter" && !loading && handleCreate()}
              maxLength={60}
              autoComplete="off"
              disabled={loading}
            />
            {error && <p className="ccm-error"><span>⚠</span> {error}</p>}
            <p className="ccm-counter">{name.length} / 60</p>
          </div>
        </div>

        <div className="ccm-footer">
          <button className="ccm-btn-cancel" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="ccm-btn-create" type="button" onClick={handleCreate} disabled={loading}>
            {loading ? <><span className="cbf-spinner" /> Creating…</> : <><span className="ccm-btn-icon">+</span> Create Tag</>}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CreateTagModal;