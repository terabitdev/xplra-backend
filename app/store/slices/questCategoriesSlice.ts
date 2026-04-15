import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { QuestCategory } from '@/lib/domain/models/questCategory';

interface QuestCategoriesState {
  categories: QuestCategory[];
  currentCategory: QuestCategory | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuestCategoriesState = {
  categories: [],
  currentCategory: null,
  loading: false,
  error: null,
};

export const fetchQuestCategories = createAsyncThunk(
  'questCategories/fetchAll',
  async (params: { fresh?: boolean } | undefined, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.fresh) queryParams.set('fresh', 'true');

      const url = `/api/quest-categories/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch quest categories');
      }

      return data.data as QuestCategory[];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createQuestCategory = createAsyncThunk(
  'questCategories/create',
  async (categoryData: Partial<QuestCategory>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/quest-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create quest category');
      }

      return data as QuestCategory;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateQuestCategory = createAsyncThunk(
  'questCategories/update',
  async ({ id, categoryData }: { id: string; categoryData: Partial<QuestCategory> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quest-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update quest category');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteQuestCategory = createAsyncThunk(
  'questCategories/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quest-categories/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete quest category');
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const sortByPriority = (categories: QuestCategory[]) =>
  [...categories].sort((a, b) => a.priority - b.priority);

const questCategoriesSlice = createSlice({
  name: 'questCategories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestCategories.fulfilled, (state, action: PayloadAction<QuestCategory[]>) => {
        state.loading = false;
        state.categories = sortByPriority(action.payload);
        state.error = null;
      })
      .addCase(fetchQuestCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createQuestCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestCategory.fulfilled, (state, action: PayloadAction<QuestCategory>) => {
        state.loading = false;
        state.categories = sortByPriority([...state.categories, action.payload]);
        state.error = null;
      })
      .addCase(createQuestCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateQuestCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuestCategory.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.category as QuestCategory;
        const index = state.categories.findIndex((c) => c.id === updated.id);
        if (index !== -1) {
          state.categories[index] = { ...state.categories[index], ...updated };
        }
        state.categories = sortByPriority(state.categories);
        state.error = null;
      })
      .addCase(updateQuestCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteQuestCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuestCategory.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.categories = state.categories.filter((c) => c.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteQuestCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentCategory } = questCategoriesSlice.actions;
export default questCategoriesSlice.reducer;
