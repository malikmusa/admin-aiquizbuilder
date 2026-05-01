/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CreateCategoryModal from "../Category/CategoryModal";
import CreateTagModal from "../Tag/TagModal";
import TextEditor from "./TextEditor";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface BlogData {
  id: string;
  title: string;
  description: string;
  content: string;
  slug: string;
  categoryId: string;
  readTime?: number;
  isPublished: boolean;
  Image?: { id: string; url: string } | null;
  Tags?: { Tag: Tag }[];
  Category?: Category | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EditBlogForm() {
  const router = useRouter();
const searchParams = useSearchParams();
const blogId = searchParams.get("id");
console.log({blogId})
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Page fetch state ──────────────────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // ── Taxonomy ──────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const initialCategoriesRef = useRef<Category[]>([]);
  const initialTagsRef = useRef<Tag[]>([]);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  // ── Form ──────────────────────────────────────────────────────────────────
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

  // ── Image ─────────────────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // ── Submit ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toSlug = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

  const hydrateForm = (blog: BlogData) => {
    setForm({
      title: blog.title ?? "",
      description: blog.description ?? "",
      content: blog.content ?? "",
      slug: blog.slug ?? "",
      categoryId: blog.categoryId ?? blog.Category?.id ?? "",
      tagIds: blog.Tags?.map((t) => t.Tag.id) ?? [],
      readTime: blog.readTime ? String(blog.readTime) : "",
      isPublished: blog.isPublished ?? false,
    });
    if (blog.Image?.url) {
      setExistingImageUrl(blog.Image.url);
      setImagePreview(`${process.env.NEXT_PUBLIC_API_BASE_URL}/${blog.Image.url}`);
    }
  };

  // ── Fetch blog by ID from API ─────────────────────────────────────────────
  useEffect(() => {
    if (!blogId) {
      setPageError("No blog ID found in URL.");
      setPageLoading(false);
      return;
    }

    (async () => {
      setPageLoading(true);
      setPageError(null);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/${blogId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        hydrateForm(json.data ?? json);
      } catch (e: any) {
        setPageError(e.message ?? "Failed to load blog.");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [blogId]);

  // ── Fetch categories ──────────────────────────────────────────────────────
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/category`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const response: { data: Category[] } = await res.json();
      const data = response?.data ?? [];
      setCategories(data);
      if (initialCategoriesRef.current.length === 0) initialCategoriesRef.current = data;
    } catch (err) {
      console.error("Could not load categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // ── Fetch tags ────────────────────────────────────────────────────────────
  const fetchTags = async () => {
    setTagsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tag`);
      if (!res.ok) throw new Error("Failed to fetch tags");
      const response: { data: Tag[] } = await res.json();
      const data = response?.data ?? [];
      setTags(data);
      if (initialTagsRef.current.length === 0) initialTagsRef.current = data;
    } catch (err) {
      console.error("Could not load tags:", err);
    } finally {
      setTagsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm((prev) => ({ ...prev, title, slug: toSlug(title) }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTag = (id: string) => {
    if (!id) return;
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter((t) => t !== id)
        : [...prev.tagIds, id],
    }));
  };

  const handleCreateCategory = async (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
    setForm((prev) => ({ ...prev, categoryId: newCat.id }));
    await fetchCategories();
    setForm((prev) => ({ ...prev, categoryId: newCat.id }));
  };

  const handleCreateTag = async (newTag: Tag) => {
    setTags((prev) => [...prev, newTag]);
    setForm((prev) => ({ ...prev, tagIds: [...prev.tagIds, newTag.id] }));
    await fetchTags();
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(newTag.id) ? prev.tagIds : [...prev.tagIds, newTag.id],
    }));
  };

  // ── Image handlers ────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please upload a valid image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setExistingImageUrl(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("content", form.content);
      formData.append("slug", form.slug);
      formData.append("categoryId", form.categoryId);
      formData.append("isPublished", String(form.isPublished));
      if (form.readTime) formData.append("readTime", String(Number(form.readTime)));

      const cleanTagIds = form.tagIds.filter((id) => id != null && id !== "");
      if (cleanTagIds.length > 0) formData.append("tagIds", JSON.stringify(cleanTagIds));

      if (imageFile) formData.append("file", imageFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/${blogId}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Request failed" }));
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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="text-sm">Loading blog…</p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (pageError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-3">{pageError}</p>
          <button
            onClick={() => router.back()}
            className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors text-gray-600"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
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

      <div className="min-h-screen bg-gray-50 px-4 py-10 md:px-10 font-sans">
        <div className="max-w-3xl mx-auto">

          {/* Page header */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Blogs
            </button>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">Content Management</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Blog Post</h1>
            <div className="mt-3 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Card 1: Core Details */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Core Details</p>
              </div>
              <div className="px-6 py-5 space-y-5">

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    name="title"
                    value={form.title}
                    onChange={handleTitleChange}
                    placeholder="Enter a compelling title…"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                    <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 select-none whitespace-nowrap">
                      /blog/
                    </span>
                    <input
                      className="flex-1 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none bg-white"
                      name="slug"
                      value={form.slug}
                      onChange={handleChange}
                      placeholder="auto-generated-slug"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Auto-generated from title, or override manually.</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="A brief summary shown in previews and SEO…"
                    rows={3}
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <TextEditor  setForm={setForm}           value={form.content} />
                  {/* <RichTextEditor
                    value={form.content}
                    onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
                  /> */}
                </div>
              </div>
            </div>

            {/* Card 2: Taxonomy & Meta */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Taxonomy & Meta</p>
              </div>
              <div className="px-6 py-5 space-y-5">

                {/* Category + Read Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white cursor-pointer"
                        name="categoryId"
                        value={form.categoryId}
                        onChange={handleChange}
                        required
                        disabled={categoriesLoading}
                      >
                        <option value="">
                          {categoriesLoading ? "Loading…" : "Select a category…"}
                        </option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 text-sm font-medium px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                      >
                        + New
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Read Time (minutes)</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      name="readTime"
                      type="number"
                      min={1}
                      value={form.readTime}
                      onChange={handleChange}
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                  <div className="flex flex-wrap items-start gap-2">
                    {tagsLoading ? (
                      <p className="text-xs text-gray-400">Loading tags…</p>
                    ) : tags.length === 0 ? (
                      <p className="text-xs text-gray-400">No tags yet — create one.</p>
                    ) : (
                      tags.map((tag) => {
                        const active = form.tagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                              active
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                            }`}
                          >
                            {tag.name}
                          </button>
                        );
                      })
                    )}
                    <button
                      type="button"
                      onClick={() => setShowTagModal(true)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all"
                    >
                      + New Tag
                    </button>
                  </div>

                  {/* New tag badges */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.tagIds.map((id) => {
                      const isNew = !initialTagsRef.current.find((t) => t.id === id);
                      const tag = tags.find((t) => t.id === id);
                      return isNew && tag ? (
                        <span key={id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full">
                          ✦ New — &quot;{tag.name}&quot;
                        </span>
                      ) : null;
                    })}
                  </div>
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
            </div>

            {/* Card 3: Cover Image */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Cover Image</p>
              </div>
              <div className="px-6 py-5">
                {imagePreview ? (
                  <div>
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Cover preview"
                        className="w-full max-h-56 object-cover rounded-lg border border-gray-200"
                      />
                      {existingImageUrl && (
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                          Current cover
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs border border-gray-200 hover:border-blue-400 text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-md transition-colors"
                      >
                        Replace image
                      </button>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-xs border border-red-200 hover:border-red-400 text-red-500 hover:text-red-700 px-3 py-1.5 rounded-md transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-xl py-10 px-6 text-center cursor-pointer transition-all ${
                      dragging
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                    onDrop={onDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-3xl mb-2">🖼</div>
                    <p className="text-sm text-gray-600">
                      Drop an image here, or <span className="font-semibold text-blue-600">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP — max 5 MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-4 flex items-center justify-between gap-4">
              <div>
                {error && (
                  <p className="text-sm text-red-600 flex items-center gap-1.5">
                    <span>⚠</span> {error}
                  </p>
                )}
                {success && (
                  <p className="text-sm text-green-600 flex items-center gap-1.5">
                    <span>✓</span> Blog updated! Redirecting…
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-5 py-2.5 text-sm border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-80" d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    "Save Changes →"
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