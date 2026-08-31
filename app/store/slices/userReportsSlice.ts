import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ReportedUserInfo {
  uid: string;
  name: string;
  email: string;
  username: string;
}

export interface UserReport {
  id: string;
  reporterUid: string;
  reporter: ReportedUserInfo | null;
  reportedUid: string;
  reported: ReportedUserInfo | null;
  reason: string;
  details: string | null;
  sourceScreen: string;
  status: string;
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

interface UserReportsState {
  reports: UserReport[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  lastFetched: number | null;
}

const initialState: UserReportsState = {
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
  data: UserReport[];
  pagination: PaginationInfo;
}

export const fetchUserReports = createAsyncThunk(
  'userReports/fetchAll',
  async (params: FetchReportsParams = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20 } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/user-reports/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch user reports');
      }

      return data as FetchReportsResponse;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(msg);
    }
  }
);

const userReportsSlice = createSlice({
  name: 'userReports',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReports.fulfilled, (state, action: PayloadAction<FetchReportsResponse>) => {
        state.loading = false;
        state.reports = action.payload.data;
        state.pagination = action.payload.pagination;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchUserReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = userReportsSlice.actions;
export default userReportsSlice.reducer;
