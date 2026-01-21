'use client';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showImage?: boolean;
}

export default function TableSkeleton({
  rows = 5,
  columns = 4,
  showImage = false
}: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex items-center gap-4">
              {showImage && (
                <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0" />
              )}
              {Array.from({ length: columns - (showImage ? 1 : 0) }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  <div
                    className="h-4 bg-gray-200 rounded"
                    style={{ width: `${Math.random() * 40 + 60}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
