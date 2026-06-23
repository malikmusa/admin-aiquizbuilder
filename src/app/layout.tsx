// app/layout.tsx
import './globals.css';
import "quill/dist/quill.snow.css";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import "quill-table-better/dist/quill-table-better.css";
 
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
