// app/(admin)/layout.tsx
import Sidebar from '../components/SideBar/Sidebar';
import '../globals.css';
import type { Metadata } from 'next'; 

export const metadata: Metadata = {
  title: 'Admin • Users',
  description: 'Read-only list of registered users',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
          overflow: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  );
}