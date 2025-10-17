'use client';

import { ReactNode } from 'react';

interface CustomScrollbarProps {
  children: ReactNode;
  className?: string;
}

export default function CustomScrollbar({ children, className = '' }: CustomScrollbarProps) {
  return (
    <div
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-200 hover:scrollbar-thumb-blue-700 ${className}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#2563eb #e5e7eb',
      }}
    >
      <style jsx global>{`
        /* Webkit browsers (Chrome, Safari, Edge) */
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #2563eb;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #1d4ed8;
        }

        /* Firefox */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #2563eb #e5e7eb;
        }
      `}</style>
      {children}
    </div>
  );
}
