import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Quest } from '@/lib/domain/models/quest';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface QuestsState {
  quests: Quest[];
  currentQuest: Quest | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  lastFetched: number | null;
}

const initialState: QuestsState = {
  quests: [],
  currentQuest: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  lastFetched: null,
};

interface FetchQuestsParams {
  page?: number;
  limit?: number;
  fresh?: boolean;
}

interface FetchQuestsResponse {
  data: Quest[];
  pagination: PaginationInfo;
  cached: boolean;
}

// Async thunks
export const fetchQuests = createAsyncThunk(
  'quests/fetchAll',
  async (params: FetchQuestsParams = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, fresh = false } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (fresh) queryParams.append('fresh', 'true');

      const response = await fetch(`/api/quests/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch quests');
      }

      return data as FetchQuestsResponse;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

export const fetchQuestById = createAsyncThunk(
  'quests/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quests/${id}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch quest');
      }

      return data as Quest;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

export const createQuest = createAsyncThunk(
  'quests/create',
  async (questData: Partial<Quest>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/quests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create quest');
      }

      return data as Quest;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

export const updateQuest = createAsyncThunk(
  'quests/update',
  async (questData: Quest, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quests/${questData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update quest');
      }

      return questData;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

export const deleteQuest = createAsyncThunk(
  'quests/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quests/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete quest');
      }

      return id;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

// Slice
const questsSlice = createSlice({
  name: 'quests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentQuest: (state) => {
      state.currentQuest = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    invalidateCache: (state) => {
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Quests
    builder
      .addCase(fetchQuests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuests.fulfilled, (state, action: PayloadAction<FetchQuestsResponse>) => {
        state.loading = false;
        state.quests = action.payload.data;
        state.pagination = action.payload.pagination;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchQuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Quest By ID
    builder
      .addCase(fetchQuestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestById.fulfilled, (state, action: PayloadAction<Quest>) => {
        state.loading = false;
        state.currentQuest = action.payload;
        state.error = null;
      })
      .addCase(fetchQuestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Quest
    builder
      .addCase(createQuest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuest.fulfilled, (state, action: PayloadAction<Quest>) => {
        state.loading = false;
        state.quests.push(action.payload);
        state.error = null;
      })
      .addCase(createQuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Quest
    builder
      .addCase(updateQuest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuest.fulfilled, (state, action: PayloadAction<Quest>) => {
        state.loading = false;
        const index = state.quests.findIndex((q) => q.id === action.payload.id);
        if (index !== -1) {
          state.quests[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateQuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Quest
    builder
      .addCase(deleteQuest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuest.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.quests = state.quests.filter((q) => q.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteQuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentQuest, setPage, invalidateCache } = questsSlice.actions;
export default questsSlice.reducer;
