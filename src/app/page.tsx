/* eslint-disable @typescript-eslint/no-explicit-any */
// app/page.tsx
import Link from 'next/link';
import { supabaseAdmin } from '../lib/supabase';

export const revalidate = 0; // always fresh

function formatDate(d?: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

async function fetchUsers(params: {
  page: number;
  perPage: number;
  email?: string;
}) {
  const { page, perPage, email } = params;

  if (email && email.trim()) {
    // Try to find user by email using listUsers with filter
    const r = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Search through more users to find the email
    });
    
    if (r.error) throw new Error(r.error.message);
    
    const users = r.data?.users ?? [];
    const filteredUser = users.find(u => u.email === email.trim());
    
    return { users: filteredUser ? [filteredUser] : [], total: filteredUser ? 1 : 0 };
  }

  const r = await supabaseAdmin.auth.admin.listUsers({ 
    page, 
    perPage: perPage 
  });
  
  if (r.error) throw new Error(r.error.message);
  
  return { 
    users: r.data?.users ?? [], 
    total: r.data?.users?.length ?? 0 // Use actual length since total might not be available
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const page = Number(searchParams.page ?? 1) || 1;
  const perPage = Math.min(100, Number(searchParams.perPage ?? 25) || 25);
  const email = (searchParams.email as string) || '';

  const { users, total } = await fetchUsers({ page, perPage, email });

  const q = new URLSearchParams();
  if (perPage) q.set('perPage', String(perPage));
  if (email) q.set('email', email);

  const prevHref = `/?${new URLSearchParams({
    ...Object.fromEntries(q),
    page: String(Math.max(1, page - 1)),
  }).toString()}`;
  const nextHref = `/?${new URLSearchParams({
    ...Object.fromEntries(q),
    page: String(page + 1),
  }).toString()}`;

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      display: 'flex',
    } as React.CSSProperties,
    
    sidebar: {
      width: '280px',
      backgroundColor: '#1e293b',
      color: 'white',
      padding: '24px',
      minHeight: '100vh',
    } as React.CSSProperties,
    
    sidebarBrand: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '32px',
      paddingBottom: '16px',
      borderBottom: '1px solid #334155',
    } as React.CSSProperties,
    
    navItem: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '8px',
      backgroundColor: '#3b82f6',
      color: 'white',
      textDecoration: 'none',
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
    } as React.CSSProperties,
    
    navItemInactive: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '8px',
      color: '#cbd5e1',
      textDecoration: 'none',
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
    } as React.CSSProperties,
    
    main: {
      flex: 1,
      padding: '32px',
      maxWidth: 'calc(100vw - 280px)',
    } as React.CSSProperties,
    
    header: {
      marginBottom: '32px',
    } as React.CSSProperties,
    
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '8px',
    } as React.CSSProperties,
    
    subtitle: {
      color: '#64748b',
      fontSize: '16px',
    } as React.CSSProperties,
    
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
    } as React.CSSProperties,
    
    cardHeader: {
      padding: '24px',
      borderBottom: '1px solid #e2e8f0',
    } as React.CSSProperties,
    
    filterForm: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      flexWrap: 'wrap',
    } as React.CSSProperties,
    
    input: {
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      minWidth: '280px',
      transition: 'border-color 0.2s',
      outline: 'none',
    } as React.CSSProperties,
    
    select: {
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: 'white',
      minWidth: '120px',
      outline: 'none',
    } as React.CSSProperties,
    
    button: {
      padding: '12px 20px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    } as React.CSSProperties,
    
    buttonSecondary: {
      padding: '12px 20px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      color: '#374151',
      fontSize: '14px',
      fontWeight: '500',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'inline-block',
    } as React.CSSProperties,
    
    stats: {
      padding: '20px 24px',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      fontSize: '14px',
      color: '#64748b',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as React.CSSProperties,
    
    tableContainer: {
      overflowX: 'auto',
    } as React.CSSProperties,
    
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    } as React.CSSProperties,
    
    tableHeader: {
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
    } as React.CSSProperties,
    
    th: {
      textAlign: 'left',
      padding: '16px 24px',
      fontSize: '12px',
      fontWeight: '600',
      color: '#374151',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    } as React.CSSProperties,
    
    td: {
      padding: '16px 24px',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '14px',
      color: '#0f172a',
    } as React.CSSProperties,
    
    tdMono: {
      padding: '16px 24px',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '13px',
      fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
      color: '#6366f1',
      backgroundColor: '#f8fafc',
    } as React.CSSProperties,
    
    emptyState: {
      padding: '48px 24px',
      textAlign: 'center',
      color: '#64748b',
    } as React.CSSProperties,
    
    pagination: {
      padding: '24px',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      gap: '12px',
    } as React.CSSProperties,
    
    status: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
    } as React.CSSProperties,
    
    statusConfirmed: {
      backgroundColor: '#dcfce7',
      color: '#166534',
    } as React.CSSProperties,
    
    statusUnconfirmed: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    } as React.CSSProperties,
    
    tip: {
      marginTop: '24px',
      padding: '16px',
      backgroundColor: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#0c4a6e',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          Admin Panel
        </div>
        <nav>
          <Link href="/" style={styles.navItem}>
            👥 User Management
          </Link>
          <Link href="#" style={styles.navItemInactive}>
            📊 Analytics
          </Link>
          <Link href="#" style={styles.navItemInactive}>
            ⚙️ Settings
          </Link>
          <Link href="#" style={styles.navItemInactive}>
            🔒 Security
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>User Management</h1>
          <p style={styles.subtitle}>
            Manage and monitor registered users in your application
          </p>
        </header>

        <div style={styles.card}>
          {/* Filters */}
          <div style={styles.cardHeader}>
            <form method="get" style={styles.filterForm}>
              <input
                type="email"
                name="email"
                defaultValue={email}
                placeholder="Search by exact email address"
                style={styles.input}
              />
              <select name="perPage" defaultValue={perPage} style={styles.select}>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <button type="submit" style={styles.button}>
                Search
              </button>
              <Link href="/" style={styles.buttonSecondary}>
                Clear Filters
              </Link>
            </form>
          </div>

          {/* Stats */}
          <div style={styles.stats}>
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

          {/* Table */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.th}>Email Address</th>
                  <th style={styles.th}>User ID</th>
                  <th style={styles.th}>Created Date</th>
                  <th style={styles.th}>Email Status</th>
                  <th style={styles.th}>Auth Providers</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={styles.emptyState}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
                      <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                        No users found
                      </div>
                      <div>
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
                      <tr key={u.id} style={{ transition: 'background-color 0.2s' }}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '500' }}>
                            {u.email ?? '—'}
                          </div>
                        </td>
                        <td style={styles.tdMono}>
                          {u.id}
                        </td>
                        <td style={styles.td}>
                          {formatDate(u.created_at)}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.status,
                              ...(isConfirmed ? styles.statusConfirmed : styles.statusUnconfirmed),
                            }}
                          >
                            {isConfirmed ? 'Confirmed' : 'Unconfirmed'}
                          </span>
                          {isConfirmed && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                              {formatDate(u.email_confirmed_at)}
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '13px',
                            backgroundColor: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {providers || '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!email && users.length > 0 && (
            <div style={styles.pagination}>
              <a
                href={prevHref}
                style={{
                  ...styles.buttonSecondary,
                  ...(page === 1 ? { opacity: 0.5, pointerEvents: 'none' } : {}),
                }}
              >
                ← Previous
              </a>
              <a href={nextHref} style={styles.buttonSecondary}>
                Next →
              </a>
            </div>
          )}
        </div>

        <div style={styles.tip}>
          <strong>💡 Pro tip:</strong> Use the email field for exact user lookup. 
          Pagination is only available when browsing all users (not when searching by email).
        </div>
      </main>
    </div>
  );
}