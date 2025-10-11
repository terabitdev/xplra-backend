import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Achievement } from '@/lib/domain/models/achievement';

interface AchievementsState {
  achievements: Achievement[];
  currentAchievement: Achievement | null;
  loading: boolean;
  error: string | null;
}

const initialState: AchievementsState = {
  achievements: [],
  currentAchievement: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchAchievements = createAsyncThunk(
  'achievements/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/achievements');
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch achievements');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchAchievementById = createAsyncThunk(
  'achievements/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/achievements/${id}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch achievement');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createAchievement = createAsyncThunk(
  'achievements/create',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create achievement');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateAchievement = createAsyncThunk(
  'achievements/update',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/achievements/${id}`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update achievement');
      }

      return { id, ...data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteAchievement = createAsyncThunk(
  'achievements/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/achievements/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete achievement');
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Slice
const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAchievement: (state) => {
      state.currentAchievement = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Achievements
    builder
      .addCase(fetchAchievements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action: PayloadAction<Achievement[]>) => {
        state.loading = false;
        state.achievements = action.payload;
        state.error = null;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Achievement By ID
    builder
      .addCase(fetchAchievementById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAchievementById.fulfilled, (state, action: PayloadAction<Achievement>) => {
        state.loading = false;
        state.currentAchievement = action.payload;
        state.error = null;
      })
      .addCase(fetchAchievementById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Achievement
    builder
      .addCase(createAchievement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAchievement.fulfilled, (state, action: PayloadAction<Achievement>) => {
        state.loading = false;
        state.achievements.push(action.payload);
        state.error = null;
      })
      .addCase(createAchievement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Achievement
    builder
      .addCase(updateAchievement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAchievement.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const index = state.achievements.findIndex((achievement) => achievement.id === action.payload.id);
        if (index !== -1) {
          state.achievements[index] = { ...state.achievements[index], ...action.payload };
        }
        state.error = null;
      })
      .addCase(updateAchievement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Achievement
    builder
      .addCase(deleteAchievement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAchievement.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.achievements = state.achievements.filter((achievement) => achievement.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteAchievement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentAchievement } = achievementsSlice.actions;
export default achievementsSlice.reducer;
