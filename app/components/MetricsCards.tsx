'use client';

import { Info, Map, MapPin, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { fetchQuests } from '@/app/store/slices/questsSlice';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  loading?: boolean;
}

const MetricCard = ({ title, value, icon: Icon, loading }: MetricCardProps) => {
  return (
    <div className="bg-white flex flex-col gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="bg-blue-600 p-2 sm:p-2.5 rounded-lg shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-sm sm:text-base font-medium text-gray-700">{title}</span>
        </div>
        <button
          className="text-gray-400 hover:text-blue-600 transition-colors p-1"
          aria-label="More info"
        >
          <Info size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>
      <div className="text-2xl sm:text-3xl lg:text-[32px] text-gray-900 font-semibold">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-gray-400 text-lg">Loading...</span>
          </div>
        ) : (
          value.toLocaleString()
        )}
      </div>
    </div>
  );
};

export default function MetricsCards() {
  const dispatch = useAppDispatch();

  const { quests, loading: questsLoading } = useAppSelector((state) => state.quests);
  const [placesCount, setPlacesCount] = useState<number>(0);
  const [eventsCount, setEventsCount] = useState<number>(0);
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchQuests({}));

    let cancelled = false;
    setCountsLoading(true);
    Promise.all([
      fetch('/api/places/count').then(r => r.ok ? r.json() : { count: 0 }),
      fetch('/api/events/count').then(r => r.ok ? r.json() : { count: 0 }),
    ])
      .then(([placesRes, eventsRes]) => {
        if (cancelled) return;
        setPlacesCount(placesRes.count || 0);
        setEventsCount(eventsRes.count || 0);
      })
      .catch((err) => {
        console.error('Failed to load dashboard counts:', err);
      })
      .finally(() => {
        if (!cancelled) setCountsLoading(false);
      });

    return () => { cancelled = true; };
  }, [dispatch]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
      <MetricCard
        title="Total Quests"
        value={quests.length}
        icon={Map}
        loading={questsLoading}
      />
      <MetricCard
        title="Total Places"
        value={placesCount}
        icon={MapPin}
        loading={countsLoading}
      />
      <MetricCard
        title="Total Events"
        value={eventsCount}
        icon={CalendarDays}
        loading={countsLoading}
      />
    </div>
  );
}
