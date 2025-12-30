import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PlaceContribution } from '@/lib/domain/models/placeContribution';

interface ContributionsState {
  contributions: PlaceContribution[];
  loading: boolean;
  error: string | null;
}

const initialState: ContributionsState = {
  contributions: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchContributions = createAsyncThunk(
  'contributions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/contributions/places/list');
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch contributions');
      }

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const reviewContribution = createAsyncThunk(
  'contributions/review',
  async ({ contributionId, action, reviewNote, adminUid }: { contributionId: string; action: 'approve' | 'reject'; reviewNote?: string; adminUid: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/contributions/places/${contributionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewNote, adminUid }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to review contribution');
      }

      return { contributionId, action };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteContribution = createAsyncThunk(
  'contributions/delete',
  async (contributionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/contributions/places/${contributionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete contribution');
      }

      return contributionId;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

// Slice
const contributionsSlice = createSlice({
  name: 'contributions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Contributions
    builder
      .addCase(fetchContributions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContributions.fulfilled, (state, action: PayloadAction<PlaceContribution[]>) => {
        state.loading = false;
        state.contributions = action.payload;
        state.error = null;
      })
      .addCase(fetchContributions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Review Contribution
    builder
      .addCase(reviewContribution.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reviewContribution.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contributions.findIndex((c) => c.contributionId === action.payload.contributionId);
        if (index !== -1) {
          state.contributions[index].status = action.payload.action === 'approve' ? 'approved' : 'rejected';
        }
        state.error = null;
      })
      .addCase(reviewContribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Contribution
    builder
      .addCase(deleteContribution.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContribution.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.contributions = state.contributions.filter((c) => c.contributionId !== action.payload);
        state.error = null;
      })
      .addCase(deleteContribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = contributionsSlice.actions;
export default contributionsSlice.reducer;
