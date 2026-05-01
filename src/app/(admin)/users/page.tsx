/* eslint-disable react-hooks/exhaustive-deps */
'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function Page() {
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      initializeData();
    } else {
      router.push('/login');
      setLoading(false);
    }
  }, []);

  const initializeData = () => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = Number(params.get('page') ?? 1) || 1;
    const perPageParam = Math.min(100, Number(params.get('perPage') ?? 25) || 25);
    const emailParam = params.get('email') || '';

    setPage(pageParam);
    setPerPage(perPageParam);
    setEmail(emailParam);

    fetchUsers(pageParam, perPageParam, emailParam);
  };

  const fetchUsers = async (p: number, pp: number, e: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('perPage', String(pp));
      if (e) params.set('email', e);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEmail = formData.get('email') as string;
    const newPerPage = Number(formData.get('perPage')) || 25;

    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('perPage', String(newPerPage));
    if (newEmail) params.set('email', newEmail);

    window.history.pushState({}, '', `/users?${params.toString()}`);

    setPage(1);
    setPerPage(newPerPage);
    setEmail(newEmail);
    fetchUsers(1, newPerPage, newEmail);
  };

  const handleClearFilters = () => {
    window.history.pushState({}, '', '/users');
    setPage(1);
    setPerPage(25);
    setEmail('');
    fetchUsers(1, 25, '');
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', String(newPage));
    params.set('perPage', String(perPage));
    if (email) params.set('email', email);

    window.history.pushState({}, '', `/users?${params.toString()}`);

    setPage(newPage);
    fetchUsers(newPage, perPage, email);
  };

  // ← No wrapping <main> here — the layout already provides it
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          User Management
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Manage and monitor registered users in your application
        </p>
      </header>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="email"
              name="email"
              defaultValue={email}
              placeholder="Search by exact email address"
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              name="perPage"
              defaultValue={perPage}
              className="px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            <button
              type="submit"
              className="px-5 py-3 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </form>
        </div>

        {/* Stats */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              Showing page <strong>{page}</strong>
              {total > 0 && (
                <> of <strong>{Math.ceil(total / perPage)}</strong></>
              )}
            </div>
            {total > 0 && (
              <div>Total users: <strong>{total.toLocaleString()}</strong></div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {!email && users.length > 0 && !loading && (
          <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium transition-colors ${
                page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
              }`}
            >
              ← Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              className="px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="text-4xl mb-4">⏳</div>
              <div className="text-lg font-medium">Loading users...</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email Address
                  </th>
                  <th className="hidden md:table-cell text-left px-4 sm:px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="hidden lg:table-cell text-left px-4 sm:px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden xl:table-cell text-left px-4 sm:px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Providers
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-slate-500">
                      <div className="text-5xl mb-4">👤</div>
                      <div className="text-lg font-medium mb-2">No users found</div>
                      <div className="text-sm">
                        {email ? 'Try adjusting your search criteria' : 'No users have registered yet'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  users?.map((u: any) => {
                    const providers = Array.isArray(u.identities)
                      ? [...new Set(u?.identities?.map((i: any) => i.provider))].join(', ')
                      : '—';
                    const isConfirmed = u.email_confirmed_at;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-900">
                          <div className="font-medium">{u.email ?? '—'}</div>
                          <div className="md:hidden mt-2 space-y-1 text-xs text-slate-600">
                            <div className="font-mono text-indigo-600 bg-slate-50 px-2 py-1 rounded inline-block">{u.id}</div>
                            <div className="lg:hidden">{formatDate(u.created_at)}</div>
                            <div className="xl:hidden">
                              <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{providers || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm font-mono text-indigo-600 bg-slate-50">
                          {u.id}
                        </td>
                        <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-slate-900">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            isConfirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isConfirmed ? 'Confirmed' : 'Unconfirmed'}
                          </span>
                          {isConfirmed && (
                            <div className="hidden lg:block text-xs text-slate-500 mt-1">
                              {formatDate(u.email_confirmed_at)}
                            </div>
                          )}
                        </td>
                        <td className="hidden xl:table-cell px-4 sm:px-6 py-4 text-sm">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{providers || '—'}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <strong>💡 Pro tip:</strong> Use the email field for exact user lookup.
        Pagination is only available when browsing all users (not when searching by email).
      </div>
    </div>
  );
}

export default Page;