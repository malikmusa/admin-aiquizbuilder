/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string }
interface Image { id: string; url: string }
interface Tag { Tag: { id: string; name: string } }

interface Blog {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  Category: Category | null;
  Image: Image | null;
  Tags: Tag[];
}

interface BlogsResponse { success: boolean; data: Blog[]; total?: number }

const LIMIT = 10;

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
    <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M8 4l2 2" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
    <path d="M2 3.5h10M5.5 3.5V2.5h3v1M5 5.5v5M9 5.5v5M3.5 3.5l.5 8h6l.5-8"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ImageFallbackIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="5.5" cy="6.5" r="1.5" fill="currentColor" opacity=".4" />
    <path d="M1 11l4-3 3 2.5 3-3.5 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-gray-100">
    {[44, 200, 90, 110, 80, 90, 100].map((w, i) => (
      <td key={i} className="px-5 py-4">
        <div className="h-3 rounded bg-gray-200 animate-pulse" style={{ width: w }} />
      </td>
    ))}
  </tr>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function BlogTable() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [limitInput, setLimitInput] = useState(LIMIT);
  const [categoryId, setCategoryId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limitInput),
        ...(search && { search }),
        ...(categoryId && { categoryId }),
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: BlogsResponse = await res.json();
      setBlogs(json.data);
      if (json.total !== undefined) setTotal(json.total);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, limitInput]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDeleteTarget(null);
      fetchBlogs();
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = total ? Math.ceil(total / limitInput) : "?";

  return (
    <div className="min-h-screen bg-white px-6 py-8 md:px-10 text-gray-800 font-sans">

      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Blog Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and monitor published blogs in your application</p>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-4 flex flex-wrap items-center gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            placeholder="Search by title or description…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Per page */}
        <select
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white cursor-pointer"
          value={limitInput}
          onChange={(e) => { setLimitInput(Number(e.target.value)); setPage(1); }}
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>

        {/* Search btn */}
        <button
          onClick={fetchBlogs}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Search
        </button>

        {/* Clear btn */}
        <button
          onClick={() => { setSearchInput(""); setCategoryId(""); setPage(1); }}
          className="border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Clear
        </button>

        {/* New Blog */}
        <a
          href="/blogs/create-blog"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ml-auto"
        >
          <PlusIcon />
          New Blog
        </a>
      </div>

      {/* ── Meta row ── */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-3.5 mb-0.5 flex items-center justify-between shadow-sm">
        <p className="text-sm text-gray-600">
          Showing page{" "}
          <span className="font-bold text-gray-900">{page}</span>{" "}
          of{" "}
          <span className="font-bold text-gray-900">{totalPages}</span>
        </p>
        <p className="text-sm text-gray-600">
          Total blogs:{" "}
          <span className="font-bold text-gray-900">{total || blogs.length}</span>
        </p>
      </div>

      {/* ── Pagination (top) ── */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-3.5 mb-4 flex items-center gap-3 shadow-sm">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="inline-flex items-center gap-1 border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 text-sm px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>
        <button
          disabled={blogs.length < limitInput}
          onClick={() => setPage((p) => p + 1)}
          className="inline-flex items-center gap-1 border border-gray-300 text-gray-700 hover:border-gray-500 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/60">
              {["Cover", "Title", "Category", "Tags", "Status", "Created", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-500 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : blogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
                      <rect x="5" y="8" width="30" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M12 16h16M12 22h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm">No blogs found</p>
                  </div>
                </td>
              </tr>
            ) : (
              blogs.map((blog) => (
                <tr
                  key={blog.id}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50/70 transition-colors"
                >
                  {/* Cover */}
                  <td className="px-5 py-4">
                    {blog.Image ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${blog.Image.url}`}
                        alt={blog.title}
                        className="w-12 h-9 rounded-md object-cover bg-gray-100 border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-9 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                        <ImageFallbackIcon />
                      </div>
                    )}
                  </td>

                  {/* Title + Description */}
                  <td className="px-5 py-4 max-w-[220px]">
                    <p className="font-semibold text-gray-900 truncate">{blog.title}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{blog.description}</p>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-4">
                    {blog.Category ? (
                      <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        {blog.Category.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Tags */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 min-w-[80px]">
                      {blog.Tags.length === 0 && (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                      {blog.Tags.slice(0, 3).map((t) => (
                        <span
                          key={t.Tag.id}
                          className="bg-gray-100 text-gray-600 border border-gray-200 text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                        >
                          {t.Tag.name}
                        </span>
                      ))}
                      {blog.Tags.length > 3 && (
                        <span className="bg-gray-100 text-gray-500 border border-gray-200 text-xs px-2 py-0.5 rounded-full">
                          +{blog.Tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    {blog.isPublished ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                          Published
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          Draft
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                    <div className="text-gray-400 mt-0.5">
                      {new Date(blog.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/blogs/edit-blog?${new URLSearchParams({ id: blog.id }).toString()}`}
                        className="inline-flex items-center gap-1.5 border border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                      >
                        <EditIcon /> Edit
                      </a>
                      <button
                        onClick={() => setDeleteTarget(blog)}
                        className="inline-flex items-center gap-1.5 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                      >
                        <TrashIcon /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Bottom Pagination ── */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-500">
          {!loading && `Showing ${blogs.length} result${blogs.length !== 1 ? "s" : ""}`}
        </p>
        <div className="flex items-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500 min-w-[60px] text-center">Page {page}</span>
          <button
            disabled={blogs.length < limitInput}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border border-gray-300 hover:border-gray-500 text-gray-700 hover:text-gray-900 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Blog?</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              <span className="text-gray-800 font-medium">&quot;{deleteTarget.title}&quot;</span>{" "}
              will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2 text-sm border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}