/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateCategoryModal from "../Category/CategoryModal";
import RichTextEditor from "../RichTextEditor/RichTextEditor";
import CreateTagModal from "../Tag/TagModal";

interface Category {
  id: string; // ← was number
  name: string;
}

export default function CreateBlogForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<any>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    slug: "",
    categoryId: "",
    tagIds: [] as string[],
    readTime: "",
    isPublished: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  // Add this ref right after the categories state

  interface Tag {
    id: string;
    name: string;
  }

  // State
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const initialTagsRef = useRef<Tag[]>([]);

  // Fetch function
  const fetchTags = async () => {
    setTagsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tag`);
      if (!res.ok) throw new Error("Failed to fetch tags");
      const response: { data: Tag[] } = await res.json();
      const data = response?.data ?? [];
      setTags(data);
      if (initialTagsRef.current.length === 0) {
        initialTagsRef.current = data;
      }
    } catch (err) {
      console.error("Could not load tags:", err);
    } finally {
      setTagsLoading(false);
    }
  };

  // Effect
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  const initialCategoriesRef = useRef<Category[]>([]); // ← tracks DB-fetched categories

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/category`,
      );
      if (!res.ok) throw new Error("Failed to fetch categories");
      const response: { data: Category[] } = await res.json();
      const data = response?.data ?? [];
      setCategories(data);

      // Only set the ref on first fetch — so newly created ones stay "new"
      if (initialCategoriesRef.current.length === 0) {
        initialCategoriesRef.current = data;
      }
    } catch (err) {
      console.error("Could not load categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCreateTag = async (newTag: Tag) => {
    setTags((prev) => [...prev, newTag]);
    setForm((prev) => ({ ...prev, tagIds: [...prev.tagIds, newTag.id] }));
    await fetchTags();
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(newTag.id)
        ? prev.tagIds
        : [...prev.tagIds, newTag.id],
    }));
  };

  // Add this effect right after your useState declarations
  useEffect(() => {
    fetchCategories();
  }, []);

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm((prev) => ({ ...prev, title, slug: toSlug(title) }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTag = (id: string) => {
    if (!id) return; // ← guard against undefined/null ids
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter((t) => t !== id)
        : [...prev.tagIds, id],
    }));
  };

  const handleCreateCategory = async (newCat: Category) => {
    // Optimistically add it and select it
    setCategories((prev: any) => [...prev, newCat]);
    setForm((prev) => ({ ...prev, categoryId: newCat.id }));

    await fetchCategories();

    setForm((prev) => ({ ...prev, categoryId: newCat.id }));
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();

      // ── Core fields ──────────────────────────────────────────────────────────
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("content", form.content);
      formData.append("slug", form.slug);

      // ── Numeric fields — Prisma expects integers, not strings ────────────────
      formData.append("categoryId", form.categoryId);
      formData.append("isPublished", String(form.isPublished));
      if (form.readTime) {
        formData.append("readTime", String(Number(form.readTime)));
      }

      // ── Tags — send as JSON so Express can parse the full array from req.body ─
      // multer parses repeated keys inconsistently; JSON is safer
      console.log({ tag: form });
      const cleanTagIds = form.tagIds.filter((id) => id != null && id !== "");
      if (cleanTagIds.length > 0) {
        formData.append("tagIds", JSON.stringify(cleanTagIds));
      }

      // ── Cover image — field name must match upload.single('file') ────────────
      if (imageFile) {
        formData.append("file", imageFile);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog`, {
        method: "POST",
        // ⚠️ Do NOT set Content-Type manually — the browser sets it automatically
        // with the correct multipart boundary when using FormData
        body: formData,
      });

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: "Request failed" }));
        throw new Error(data.error || data.message || "Something went wrong.");
      }

      setSuccess(true);
      setTimeout(() => router.push("/blogs"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showCategoryModal && (
        <CreateCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCreate={handleCreateCategory}
        />
      )}
      {showTagModal && (
        <CreateTagModal
          onClose={() => setShowTagModal(false)}
          onCreate={handleCreateTag}
        />
      )}

      <div className="cbf-root">
        <div className="cbf-wrap">
          <header className="cbf-header">
            <p className="cbf-eyebrow">Content Management</p>
            <h1 className="cbf-title">New Blog Post</h1>
            <hr className="cbf-rule" />
          </header>

          <form onSubmit={handleSubmit}>
            <div className="cbf-card">
              {/* ── Section 1: Core Details ── */}
              <div className="cbf-section">
                <p className="cbf-section-label">Core Details</p>

                <div className="cbf-field">
                  <label className="cbf-label">
                    Title <span className="req">*</span>
                  </label>
                  <input
                    className="cbf-input"
                    name="title"
                    value={form.title}
                    onChange={handleTitleChange}
                    placeholder="Enter a compelling title…"
                    required
                  />
                </div>

                <div className="cbf-field">
                  <label className="cbf-label">Slug</label>
                  <div className="cbf-slug-wrap">
                    <span className="cbf-slug-prefix">/blog/</span>
                    <input
                      className="cbf-input cbf-slug-input"
                      name="slug"
                      value={form.slug}
                      onChange={handleChange}
                      placeholder="auto-generated-slug"
                    />
                  </div>
                  <p className="cbf-hint">
                    Auto-generated from the title, or override manually.
                  </p>
                </div>

                <div className="cbf-field">
                  <label className="cbf-label">
                    Description <span className="req">*</span>
                  </label>
                  <textarea
                    className="cbf-textarea"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="A brief summary shown in previews and SEO…"
                    rows={3}
                    required
                  />
                </div>

                <div className="cbf-field">
                  <label className="cbf-label">
                    Content <span className="req">*</span>
                  </label>
                  <RichTextEditor
                    value={form.content}
                    onChange={(html) =>
                      setForm((prev) => ({ ...prev, content: html }))
                    }
                  />
                </div>
              </div>

              {/* ── Section 2: Taxonomy & Meta ── */}
              <div className="cbf-section">
                <p className="cbf-section-label">Taxonomy & Meta</p>

                <div className="cbf-row">
                  <div className="cbf-field">
                    <label className="cbf-label">
                      Category <span className="req">*</span>
                    </label>
                    <div className="cbf-cat-row">
                      <div className="cbf-select-wrap">
                        <select
                          className="cbf-select"
                          name="categoryId"
                          value={form.categoryId}
                          onChange={handleChange}
                          required
                          disabled={categoriesLoading} // ← add this
                        >
                          <option value="">
                            {categoriesLoading
                              ? "Loading categories…"
                              : "Select a category…"}{" "}
                            {/* ← and this */}
                          </option>
                          {categories?.map((c: any) => (
                            <option key={c?.id} value={c?.id}>
                              {c?.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn-new-cat"
                        onClick={() => setShowCategoryModal(true)}
                        title="Create a new category"
                      >
                        + New
                      </button>
                    </div>
                    {(() => {
                      const selected = categories?.find(
                        (c: any) => c?.id === form.categoryId,
                      );
                      const isNew =
                        selected &&
                        !categories?.find((c: any) => c?.id === selected.id);
                      return isNew ? (
                        <span className="cat-badge">
                          ✦ New — &quot;{selected?.name}&quot;
                        </span>
                      ) : null;
                    })()}
                  </div>

                  <div className="cbf-field">
                    <label className="cbf-label">Read Time (minutes)</label>
                    <input
                      className="cbf-input"
                      name="readTime"
                      type="number"
                      min={1}
                      value={form.readTime}
                      onChange={handleChange}
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>

                {/* ── Tags ── */}
                <div className="cbf-field" style={{ marginTop: 18 }}>
                  <label className="cbf-label">Tags</label>

                  <div
                    className="cbf-cat-row"
                    style={{
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {tagsLoading ? (
                      <p className="cbf-hint">Loading tags…</p>
                    ) : (
                      <div className="cbf-tags">
                        {tags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            className={`cbf-tag${form.tagIds.includes(tag.id) ? " active" : ""}`}
                            onClick={() => tag.id && toggleTag(tag.id)} // ← guard here too
                          >
                            {tag.name}
                          </button>
                        ))}
                        {tags.length === 0 && !tagsLoading && (
                          <p className="cbf-hint">No tags yet — create one.</p>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-new-cat"
                      onClick={() => setShowTagModal(true)}
                      title="Create a new tag"
                    >
                      + New
                    </button>
                  </div>

                  {/* New tag badges */}
                  {form.tagIds.map((id) => {
                    const isNew = !initialTagsRef.current.find(
                      (t) => t.id === id,
                    );
                    const tag = tags.find((t) => t.id === id);
                    return isNew && tag ? (
                      <span key={id} className="cat-badge">
                        ✦ New — &quot;{tag.name}&quot;
                      </span>
                    ) : null;
                  })}
                </div>
                  {/* Publish toggle */}
                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-gray-50/40">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Published</p>
                    <p className="text-xs text-gray-400 mt-0.5">Toggle to make this post visible to the public</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, isPublished: !prev.isPublished }))}
                    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                      form.isPublished ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        form.isPublished ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* ── Section 3: Cover Image ── */}
              <div className="cbf-section">
                <p className="cbf-section-label">Cover Image</p>

                {imagePreview ? (
                  <div className="cbf-preview-wrap">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="cbf-preview"
                    />
                    <button
                      type="button"
                      className="cbf-preview-remove"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className={`cbf-drop${dragging ? " dragging" : ""}`}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="cbf-drop-icon">🖼</div>
                    <p className="cbf-drop-text">
                      Drop an image here, or <strong>browse</strong>
                    </p>
                    <p className="cbf-drop-sub">PNG, JPG, WebP — max 5 MB</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              {/* ── Footer ── */}
              <div className="cbf-footer">
                <div>
                  {error && <p className="cbf-feedback error">⚠ {error}</p>}
                  {success && (
                    <p className="cbf-feedback success">
                      ✓ Blog published! Redirecting…
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="cbf-submit"
                  disabled={loading || success}
                >
                  {loading ? (
                    <>
                      <span className="cbf-spinner" /> Publishing…
                    </>
                  ) : (
                    <>Publish Post →</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
