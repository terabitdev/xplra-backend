'use client';

import { useState } from 'react';
import Image from 'next/image';

interface StaticMapPreviewProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  height?: string;
}

export default function StaticMapPreview({ lat, lng, zoom = 14, height = 'h-56' }: StaticMapPreviewProps) {
  const [errored, setErrored] = useState(false);

  const isValid =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0);

  if (!isValid || errored) {
    return (
      <div className={`w-full ${height} bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400`}>
        <div className="text-center px-4">
          <svg className="w-8 h-8 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs">{errored ? 'Map could not load' : 'Invalid coordinates'}</p>
        </div>
      </div>
    );
  }

  const src = `/api/maps/static?lat=${lat}&lng=${lng}&zoom=${zoom}&size=640x320`;

  return (
    <div className={`relative w-full ${height} rounded-lg overflow-hidden border border-gray-200 bg-gray-100`}>
      <Image
        src={src}
        alt="Place location map"
        fill
        className="object-cover"
        unoptimized
        onError={() => setErrored(true)}
      />
    </div>
  );
}
