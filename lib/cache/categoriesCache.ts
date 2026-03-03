import { Category } from '@/lib/domain/models/category';

let categoriesCache: { data: Category[]; timestamp: number } | null = null;
const CACHE_DURATION = 120 * 1000; // 2 minutes

export function getCategoriesCache() {
  const now = Date.now();
  if (categoriesCache && (now - categoriesCache.timestamp) < CACHE_DURATION) {
    return categoriesCache.data;
  }
  return null;
}

export function setCategoriesCache(data: Category[]) {
  categoriesCache = { data, timestamp: Date.now() };
}

export function invalidateCategoriesCache() {
  categoriesCache = null;
}
