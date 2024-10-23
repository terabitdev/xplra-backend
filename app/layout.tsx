// app/layout.tsx

import './globals.css'; // Import global CSS
import './bootstrap.min.css'; // Import bootstrap CSS
import { Head } from 'next/document';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">

      <body>{children}</body>
    </html>
  );
}
