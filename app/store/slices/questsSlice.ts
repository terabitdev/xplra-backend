import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Quest } from '@/lib/domain/models/quest';

interface QuestsState {
  quests: Quest[];
  currentQuest: Quest | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuestsState = {
  quests: [],
  currentQuest: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchQuests = createAsyncThunk(
  'quests/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/quests/list');
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch quests');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
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

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createQuest = createAsyncThunk(
  'quests/create',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/quests/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create quest');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateQuest = createAsyncThunk(
  'quests/update',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quests/${id}`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update quest');
      }

      return { id, ...data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
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
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
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
  },
  extraReducers: (builder) => {
    // Fetch All Quests
    builder
      .addCase(fetchQuests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuests.fulfilled, (state, action: PayloadAction<Quest[]>) => {
        state.loading = false;
        state.quests = action.payload;
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
      .addCase(updateQuest.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const index = state.quests.findIndex((quest) => quest.id === action.payload.id);
        if (index !== -1) {
          state.quests[index] = { ...state.quests[index], ...action.payload };
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
        state.quests = state.quests.filter((quest) => quest.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteQuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentQuest } = questsSlice.actions;
export default questsSlice.reducer;
