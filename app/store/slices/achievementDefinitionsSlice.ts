import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AchievementDefinition } from '@/lib/domain/models/achievementDefinition';

interface AchievementDefinitionsState {
  definitions: AchievementDefinition[];
  loading: boolean;
  error: string | null;
}

const initialState: AchievementDefinitionsState = {
  definitions: [],
  loading: false,
  error: null,
};

export const fetchAchievementDefinitions = createAsyncThunk(
  'achievementDefinitions/fetchAll',
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/achievement-definitions/list');
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch achievement definitions');
      }

      return data.data as AchievementDefinition[];
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

export const createAchievementDefinition = createAsyncThunk(
  'achievementDefinitions/create',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/achievement-definitions/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create achievement definition');
      }

      return data as AchievementDefinition;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

export const updateAchievementDefinition = createAsyncThunk(
  'achievementDefinitions/update',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/achievement-definitions/${id}`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update achievement definition');
      }

      return data as { definition: AchievementDefinition };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

export const deleteAchievementDefinition = createAsyncThunk(
  'achievementDefinitions/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/achievement-definitions/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete achievement definition');
      }

      return id;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

const achievementDefinitionsSlice = createSlice({
  name: 'achievementDefinitions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievementDefinitions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAchievementDefinitions.fulfilled, (state, action: PayloadAction<AchievementDefinition[]>) => {
        state.loading = false;
        state.definitions = action.payload;
        state.error = null;
      })
      .addCase(fetchAchievementDefinitions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createAchievementDefinition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAchievementDefinition.fulfilled, (state, action: PayloadAction<AchievementDefinition>) => {
        state.loading = false;
        state.definitions.unshift(action.payload);
        state.error = null;
      })
      .addCase(createAchievementDefinition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateAchievementDefinition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAchievementDefinition.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.definition;
        const index = state.definitions.findIndex((d) => d.id === updated.id);
        if (index !== -1) {
          state.definitions[index] = { ...state.definitions[index], ...updated };
        }
        state.error = null;
      })
      .addCase(updateAchievementDefinition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteAchievementDefinition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAchievementDefinition.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.definitions = state.definitions.filter((d) => d.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteAchievementDefinition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = achievementDefinitionsSlice.actions;
export default achievementDefinitionsSlice.reducer;
