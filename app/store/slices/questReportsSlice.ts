import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface QuestReport {
  id: string;
  questId: string;
  quest: Record<string, unknown>;
  reason: string;
  details?: string;
  reporter: {
    userId: string;
    email: string;
    displayName: string;
  };
  reportedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface QuestReportsState {
  reports: QuestReport[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  lastFetched: number | null;
}

const initialState: QuestReportsState = {
  reports: [],
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

interface FetchReportsParams {
  page?: number;
  limit?: number;
}

interface FetchReportsResponse {
  data: QuestReport[];
  pagination: PaginationInfo;
}

export const fetchQuestReports = createAsyncThunk(
  'questReports/fetchAll',
  async (params: FetchReportsParams = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20 } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/quest-reports/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch quest reports');
      }

      return data as FetchReportsResponse;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

const questReportsSlice = createSlice({
  name: 'questReports',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestReports.fulfilled, (state, action: PayloadAction<FetchReportsResponse>) => {
        state.loading = false;
        state.reports = action.payload.data;
        state.pagination = action.payload.pagination;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchQuestReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = questReportsSlice.actions;
export default questReportsSlice.reducer;
