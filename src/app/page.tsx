/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

// app/page.tsx
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Static credentials
const ADMIN_EMAIL = 'malikmusa1997@gmail.com';
const ADMIN_PASSWORD = 'Musa@system1997!';

function formatDate(d?: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      initializeData();
    } else {
      setLoading(false);
    }
  }, []);

  // Initialize data after authentication
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

    window.history.pushState({}, '', `/?${params.toString()}`);

    setPage(1);
    setPerPage(newPerPage);
    setEmail(newEmail);
    fetchUsers(1, newPerPage, newEmail);
  };

  const handleClearFilters = () => {
    window.history.pushState({}, '', '/');
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

    window.history.pushState({}, '', `/?${params.toString()}`);

    setPage(newPage);
    fetchUsers(newPage, perPage, email);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuthenticated', 'true');
      setIsAuthenticated(true);
      initializeData();
    } else {
      setLoginError('Invalid email or password. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
    setUsers([]);
    setTotal(0);
    setPage(1);
    setPerPage(25);
    setEmail('');
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-10 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-blue-100">Sign in to access the dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="px-8 py-10">
              {loginError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">{loginError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sign In
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
              <p className="text-center text-xs text-gray-500">
                Protected admin area. Authorized access only.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
        aria-label="Toggle sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isSidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 bg-slate-800 text-white p-6 min-h-screen
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="text-xl font-bold mb-8 pb-4 border-b border-slate-700">
          Admin Panel
        </div>
        <nav className="space-y-2 flex-1">
          <Link
            href="/"
            className="block px-4 py-3 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors"
          >
            👥 User Management
          </Link>
          <Link
            href="#"
            className="block px-4 py-3 rounded-lg text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors"
          >
            📊 Analytics
          </Link>
          <Link
            href="#"
            className="block px-4 py-3 rounded-lg text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors"
          >
            ⚙️ Settings
          </Link>
          <Link
            href="#"
            className="block px-4 py-3 rounded-lg text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors"
          >
            🔒 Security
          </Link>
        </nav>

        {/* Logout Button */}
        <div className="mt-auto pt-6 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:w-auto">
        {/* Header */}
        <header className="mb-6 sm:mb-8 pt-12 lg:pt-0">
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
                  <>
                    {' '}of{' '}
                    <strong>{Math.ceil(total / perPage)}</strong>
                  </>
                )}
              </div>
              {total > 0 && (
                <div>
                  Total users: <strong>{total.toLocaleString()}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {!email && users.length > 0 && !loading && (
            <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`
                  px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium
                  transition-colors
                  ${page === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50 cursor-pointer'
                  }
                `}
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
                    users.map((u: any) => {
                      const providers = Array.isArray(u.identities)
                        ? [...new Set(u.identities.map((i: any) => i.provider))].join(', ')
                        : '—';

                      const isConfirmed = u.email_confirmed_at;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                          <td className="px-4 sm:px-6 py-4 text-sm text-slate-900">
                            <div className="font-medium">{u.email ?? '—'}</div>
                            {/* Show mobile details */}
                            <div className="md:hidden mt-2 space-y-1 text-xs text-slate-600">
                              <div className="font-mono text-indigo-600 bg-slate-50 px-2 py-1 rounded inline-block">
                                {u.id}
                              </div>
                              <div className="lg:hidden">{formatDate(u.created_at)}</div>
                              <div className="xl:hidden">
                                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                  {providers || '—'}
                                </span>
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
                            <span
                              className={`
                                inline-block px-2 py-1 rounded text-xs font-medium
                                ${isConfirmed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }
                              `}
                            >
                              {isConfirmed ? 'Confirmed' : 'Unconfirmed'}
                            </span>
                            {isConfirmed && (
                              <div className="hidden lg:block text-xs text-slate-500 mt-1">
                                {formatDate(u.email_confirmed_at)}
                              </div>
                            )}
                          </td>
                          <td className="hidden xl:table-cell px-4 sm:px-6 py-4 text-sm">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                              {providers || '—'}
                            </span>
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
      </main>
    </div>
  );
}