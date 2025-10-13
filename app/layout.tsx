// app/layout.tsx

import './globals.css'; // Import global CSS
import './suppress-warnings'; // Suppress browser extension warnings
import { ReactNode } from 'react';
import { ReduxProvider } from './store/ReduxProvider';
import { SearchProvider } from './contexts/SearchContext';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <SearchProvider>
            {children}
          </SearchProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
