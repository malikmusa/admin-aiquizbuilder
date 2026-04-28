/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useRef, useState } from "react";

interface Category {
  id: string; // UUID from Prisma
  name: string;
}

function CreateCategoryModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (category: Category) => void; // ← now receives full object
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
    if (!trimmed) {
      setError("Category name is required.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Must be at least 2 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Failed to create category.");
      }

      const created: Category = await res.json();
      onCreate(created); // pass real { id, name } back up
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
      <div className="ccm-card" role="dialog" aria-modal="true" aria-labelledby="ccm-title">

        {/* Header */}
        <div className="ccm-header">
          <div>
            <p className="ccm-eyebrow">Taxonomy</p>
            <h2 className="ccm-title" id="ccm-title">New Category</h2>
          </div>
          <button className="ccm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="ccm-body">
          <div className="ccm-field">
            <label className="ccm-label" htmlFor="ccm-name-input">
              Category Name <span className="req">*</span>
            </label>

            <input
              id="ccm-name-input"
              ref={inputRef}
              className={`ccm-input${error ? " ccm-input--error" : ""}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Technology, Lifestyle, Travel…"
              onKeyDown={(e) => e.key === "Enter" && !loading && handleCreate()}
              maxLength={60}
              autoComplete="off"
              disabled={loading}
            />

            {error && (
              <p className="ccm-error">
                <span>⚠</span> {error}
              </p>
            )}

            <p className="ccm-counter">{name.length} / 60</p>
          </div>
        </div>

        {/* Footer */}
        <div className="ccm-footer">
          <button
            className="ccm-btn-cancel"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="ccm-btn-create"
            type="button"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <><span className="cbf-spinner" /> Creating…</>
            ) : (
              <><span className="ccm-btn-icon">+</span> Create Category</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CreateCategoryModal;