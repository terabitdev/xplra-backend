import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  type?: string;
  xpTotal?: number;
  xpEarnedAllTime?: number;
  level?: number;
  dailyXpEarned?: number;
  lastDailyReset?: string;
  lastXpUpdate?: string;
  createdAt?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  lastFetched: number | null;
}

const initialState: UsersState = {
  users: [],
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

interface FetchUsersParams {
  page?: number;
  limit?: number;
  fresh?: boolean;
}

interface FetchUsersResponse {
  data: User[];
  pagination: PaginationInfo;
  cached: boolean;
}

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (params: FetchUsersParams = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, fresh = false } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (fresh) queryParams.append('fresh', 'true');

      const response = await fetch(`/api/users/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch users');
      }

      return data as FetchUsersResponse;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

// Slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    invalidateCache: (state) => {
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<FetchUsersResponse>) => {
        state.loading = false;
        state.users = action.payload.data;
        state.pagination = action.payload.pagination;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setPage, invalidateCache } = usersSlice.actions;
export default usersSlice.reducer;
