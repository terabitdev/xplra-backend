'use client';

import { Info, Map, Compass, FolderTree } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { LucideIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { fetchQuests } from '@/app/store/slices/questsSlice';
import { fetchAdventures } from '@/app/store/slices/adventuresSlice';
import { fetchCategories } from '@/app/store/slices/categoriesSlice';

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

  // Get current user
  const currentUser = useAppSelector((state) => state.auth.user);

  // Get data from slices
  const { quests, loading: questsLoading } = useAppSelector((state) => state.quests);
  const { adventures, loading: adventuresLoading } = useAppSelector((state) => state.adventures);
  const { categories, loading: categoriesLoading } = useAppSelector((state) => state.categories);

  // Fetch all data on mount
  useEffect(() => {
    dispatch(fetchQuests({}));
    dispatch(fetchAdventures());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Filter data by current admin's userId and calculate stats
  const stats = useMemo(() => {
    const userId = currentUser?.uid;

    if (!userId) {
      return {
        totalQuests: 0,
        totalAdventures: 0,
        totalCategories: 0,
      };
    }

    return {
      // Note: Quests are global entities, so we count all of them
      totalQuests: quests.length,
      totalAdventures: adventures.filter(adventure => adventure.userId === userId).length,
      totalCategories: categories.filter(category => category.userId === userId).length,
    };
  }, [quests, adventures, categories, currentUser]);

  // Combined loading state
  const loading = questsLoading || adventuresLoading || categoriesLoading;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
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
    </div>
  );
}
