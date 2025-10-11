'use client';

import { Info, Map, Compass, FolderTree, Trophy } from 'lucide-react';
import { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  loading?: boolean;
}

const MetricCard = ({ title, value, icon: Icon, loading }: MetricCardProps) => {
  return (
    <div className="bg-white flex flex-col gap-8  p-4 rounded-lg shadow-sm">
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className="bg-blue-600 p-2 rounded-md mr-3">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-black">{title}</span>
        </div>
        <button
          className="text-black hover:text-blue-600 transition-colors"
        >
          <Info size={20} />
        </button>
      </div>
      <div className="text-[32px] text-black font-[500]">
        {loading ? '...' : value.toLocaleString()}
      </div>
    </div>
  );
};

export default function MetricsCards() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalQuests: 0,
    totalAdventures: 0,
    totalCategories: 0,
    totalAchievements: 0,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <MetricCard
        title="Total Quests"
        value={stats.totalQuests}
        icon={Map}
        loading={loading}
      />
      <MetricCard
        title="Total Adventures"
        value={stats.totalAdventures}
        icon={Compass}
        loading={loading}
      />
      <MetricCard
        title="Total Categories"
        value={stats.totalCategories}
        icon={FolderTree}
        loading={loading}
      />
      <MetricCard
        title="Total Achievements"
        value={stats.totalAchievements}
        icon={Trophy}
        loading={loading}
      />
    </div>
  );
}
