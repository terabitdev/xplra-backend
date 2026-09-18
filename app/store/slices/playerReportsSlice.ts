import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface PlayerReportUserInfo {
  uid: string;
  name: string;
  email: string;
  username: string;
  accountStatus: string;
}

export interface PlayerReport {
  id: string;
  reporterUid: string;
  reporter: PlayerReportUserInfo | null;
  reportedUid: string;
  reported: PlayerReportUserInfo | null;
  reason: string;
  details: string | null;
  sourceScreen: string;
  status: string;
  resolution: string;
  resolutionNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface StatusCounts {
  all: number;
  OPEN: number;
  RESOLVED: number;
  DISMISSED: number;
}

export type PlayerReportStatusFilter = 'all' | 'OPEN' | 'RESOLVED' | 'DISMISSED';

interface PlayerReportsState {
  reports: PlayerReport[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  counts: StatusCounts;
  statusFilter: PlayerReportStatusFilter;
  lastFetched: number | null;
}

const initialState: PlayerReportsState = {
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
  counts: { all: 0, OPEN: 0, RESOLVED: 0, DISMISSED: 0 },
  statusFilter: 'OPEN',
  lastFetched: null,
};

interface FetchReportsParams {
  page?: number;
  limit?: number;
  status?: PlayerReportStatusFilter;
}

interface FetchReportsResponse {
  data: PlayerReport[];
  pagination: PaginationInfo;
  counts: StatusCounts;
}

export const fetchPlayerReports = createAsyncThunk(
  'playerReports/fetchAll',
  async (params: FetchReportsParams = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, status } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status && status !== 'all') queryParams.set('status', status);

      const response = await fetch(`/api/player-reports/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch player reports');
      }

      return data as FetchReportsResponse;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

const playerReportsSlice = createSlice({
  name: 'playerReports',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setStatusFilter: (state, action: PayloadAction<PlayerReportStatusFilter>) => {
      state.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlayerReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayerReports.fulfilled, (state, action: PayloadAction<FetchReportsResponse>) => {
        state.loading = false;
        state.reports = action.payload.data;
        state.pagination = action.payload.pagination;
        state.counts = action.payload.counts;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchPlayerReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setStatusFilter } = playerReportsSlice.actions;
export default playerReportsSlice.reducer;
