// app/layout.tsx
import './globals.css'; 

 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
        }}
      > 
          {children}
        
      </body>
    </html>
  );
}
