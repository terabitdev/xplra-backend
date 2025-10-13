'use client';

import { Info, Map, Compass, FolderTree, Trophy } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { LucideIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { fetchQuests } from '@/app/store/slices/questsSlice';
import { fetchAdventures } from '@/app/store/slices/adventuresSlice';
import { fetchCategories } from '@/app/store/slices/categoriesSlice';
import { fetchAchievements } from '@/app/store/slices/achievementsSlice';

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
  const dispatch = useAppDispatch();

  // Get current user
  const currentUser = useAppSelector((state) => state.auth.user);

  // Get data from slices
  const { quests, loading: questsLoading } = useAppSelector((state) => state.quests);
  const { adventures, loading: adventuresLoading } = useAppSelector((state) => state.adventures);
  const { categories, loading: categoriesLoading } = useAppSelector((state) => state.categories);
  const { achievements, loading: achievementsLoading } = useAppSelector((state) => state.achievements);

  // Fetch all data on mount
  useEffect(() => {
    dispatch(fetchQuests());
    dispatch(fetchAdventures());
    dispatch(fetchCategories());
    dispatch(fetchAchievements());
  }, [dispatch]);

  // Filter data by current admin's userId and calculate stats
  const stats = useMemo(() => {
    const userId = currentUser?.uid;

    if (!userId) {
      return {
        totalQuests: 0,
        totalAdventures: 0,
        totalCategories: 0,
        totalAchievements: 0,
      };
    }

    return {
      totalQuests: quests.filter(quest => quest.userId === userId).length,
      totalAdventures: adventures.filter(adventure => adventure.userId === userId).length,
      totalCategories: categories.filter(category => category.userId === userId).length,
      totalAchievements: achievements.filter(achievement => achievement.userId === userId).length,
    };
  }, [quests, adventures, categories, achievements, currentUser]);

  // Combined loading state
  const loading = questsLoading || adventuresLoading || categoriesLoading || achievementsLoading;

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
