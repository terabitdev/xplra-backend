import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Adventure } from '@/lib/domain/models/adventures';

interface AdventuresState {
  adventures: Adventure[];
  currentAdventure: Adventure | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdventuresState = {
  adventures: [],
  currentAdventure: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchAdventures = createAsyncThunk(
  'adventures/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/adventures');
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch adventures');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchAdventureById = createAsyncThunk(
  'adventures/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/adventures/${id}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch adventure');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createAdventure = createAsyncThunk(
  'adventures/create',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/adventures', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create adventure');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateAdventure = createAsyncThunk(
  'adventures/update',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/adventures/${id}`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update adventure');
      }

      return { id, ...data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteAdventure = createAsyncThunk(
  'adventures/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/adventures/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete adventure');
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Slice
const adventuresSlice = createSlice({
  name: 'adventures',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAdventure: (state) => {
      state.currentAdventure = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Adventures
    builder
      .addCase(fetchAdventures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdventures.fulfilled, (state, action: PayloadAction<Adventure[]>) => {
        state.loading = false;
        state.adventures = action.payload;
        state.error = null;
      })
      .addCase(fetchAdventures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Adventure By ID
    builder
      .addCase(fetchAdventureById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdventureById.fulfilled, (state, action: PayloadAction<Adventure>) => {
        state.loading = false;
        state.currentAdventure = action.payload;
        state.error = null;
      })
      .addCase(fetchAdventureById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Adventure
    builder
      .addCase(createAdventure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAdventure.fulfilled, (state, action: PayloadAction<Adventure>) => {
        state.loading = false;
        state.adventures.push(action.payload);
        state.error = null;
      })
      .addCase(createAdventure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Adventure
    builder
      .addCase(updateAdventure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdventure.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const index = state.adventures.findIndex((adv) => adv.id === action.payload.id);
        if (index !== -1) {
          state.adventures[index] = { ...state.adventures[index], ...action.payload };
        }
        state.error = null;
      })
      .addCase(updateAdventure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Adventure
    builder
      .addCase(deleteAdventure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdventure.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.adventures = state.adventures.filter((adv) => adv.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteAdventure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentAdventure } = adventuresSlice.actions;
export default adventuresSlice.reducer;
