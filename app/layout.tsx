// app/layout.tsx

import './globals.css'; // Import global CSS
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS globally
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
