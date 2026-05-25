import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Place } from '@/lib/domain/models/place';

export type ContributionTab = 'all' | 'pending' | 'approved' | 'rejected';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ContributionCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ContributionsState {
  contributions: Place[];
  submitters: Record<string, { displayName: string | null }>;
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  counts: ContributionCounts;
  countsLoading: boolean;
  currentTab: ContributionTab;
  lastFetched: number | null;
}

const initialState: ContributionsState = {
  contributions: [],
  submitters: {},
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
  countsLoading: false,
  currentTab: 'pending',
  lastFetched: null,
};

interface FetchContributionsParams {
  tab?: ContributionTab;
  page?: number;
  limit?: number;
}

interface FetchContributionsResponse {
  data: Place[];
  submitters?: Record<string, { displayName: string | null }>;
  pagination: PaginationInfo;
}

export const fetchContributions = createAsyncThunk(
  'contributions/fetchList',
  async (params: FetchContributionsParams = {}, { rejectWithValue }) => {
    try {
      const { tab = 'pending', page = 1, limit = 12 } = params;
      const qs = new URLSearchParams({
        tab,
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await fetch(`/api/contributions/list?${qs}`);
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch contributions');
      }
      return data as FetchContributionsResponse;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  },
);

export const fetchContributionCounts = createAsyncThunk(
  'contributions/fetchCounts',
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/contributions/counts');
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to load counts');
      }
      return data as ContributionCounts;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  },
);

export const approveContribution = createAsyncThunk(
  'contributions/approve',
  async ({ placeId, contributionXp }: { placeId: string; contributionXp: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/contributions/${placeId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributionXp }),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to approve');
      }
      return { placeId, contributionXp };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  },
);

export const rejectContribution = createAsyncThunk(
  'contributions/reject',
  async ({ placeId, rejectionReason }: { placeId: string; rejectionReason: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/contributions/${placeId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to reject');
      }
      return { placeId, rejectionReason };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  },
);

const contributionsSlice = createSlice({
  name: 'contributions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTab: (state, action: PayloadAction<ContributionTab>) => {
      state.currentTab = action.payload;
      state.pagination.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContributions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContributions.fulfilled, (state, action: PayloadAction<FetchContributionsResponse>) => {
        state.loading = false;
        state.contributions = action.payload.data;
        state.submitters = action.payload.submitters || {};
        state.pagination = action.payload.pagination;
        state.lastFetched = Date.now();
      })
      .addCase(fetchContributions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchContributionCounts.pending, (state) => {
        state.countsLoading = true;
      })
      .addCase(fetchContributionCounts.fulfilled, (state, action: PayloadAction<ContributionCounts>) => {
        state.counts = action.payload;
        state.countsLoading = false;
      })
      .addCase(fetchContributionCounts.rejected, (state) => {
        state.countsLoading = false;
      });

    builder
      .addCase(approveContribution.fulfilled, (state, action) => {
        const { placeId, contributionXp } = action.payload;
        const idx = state.contributions.findIndex((c) => c.placeId === placeId);
        if (idx !== -1) {
          state.contributions[idx] = { ...state.contributions[idx], status: 'approved', contributionXp };
        }
      })
      .addCase(approveContribution.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(rejectContribution.fulfilled, (state, action) => {
        const { placeId, rejectionReason } = action.payload;
        const idx = state.contributions.findIndex((c) => c.placeId === placeId);
        if (idx !== -1) {
          state.contributions[idx] = { ...state.contributions[idx], status: 'rejected', rejectionReason };
        }
      })
      .addCase(rejectContribution.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setTab, setPage } = contributionsSlice.actions;
export default contributionsSlice.reducer;
