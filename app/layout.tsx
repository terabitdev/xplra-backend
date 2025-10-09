// app/layout.tsx

import './globals.css'; // Import global CSS
import { ReactNode } from 'react';
import { ReduxProvider } from './store/ReduxProvider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
