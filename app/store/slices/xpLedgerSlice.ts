import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { XpLedgerEntry, CreateXpLedgerRequest } from '@/lib/domain/models/xpLedger';

interface XpLedgerState {
  entries: XpLedgerEntry[];
  userXpTotal: number;
  userXpEarnedAllTime: number;
  loading: boolean;
  error: string | null;
}

const initialState: XpLedgerState = {
  entries: [],
  userXpTotal: 0,
  userXpEarnedAllTime: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchXpLedger = createAsyncThunk(
  'xpLedger/fetchByUid',
  async ({ uid, limit, type }: { uid: string; limit?: number; type?: string }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (type) params.append('type', type);

      const response = await fetch(`/api/xp-ledger/${uid}?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch XP ledger');
      }

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createXpLedgerEntry = createAsyncThunk(
  'xpLedger/create',
  async (entryData: CreateXpLedgerRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/xp-ledger/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create XP ledger entry');
      }

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

// Slice
const xpLedgerSlice = createSlice({
  name: 'xpLedger',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearEntries: (state) => {
      state.entries = [];
      state.userXpTotal = 0;
      state.userXpEarnedAllTime = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch XP Ledger
    builder
      .addCase(fetchXpLedger.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchXpLedger.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.entries = action.payload.entries;
        state.userXpTotal = action.payload.userXpTotal;
        state.userXpEarnedAllTime = action.payload.userXpEarnedAllTime;
        state.error = null;
      })
      .addCase(fetchXpLedger.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create XP Ledger Entry
    builder
      .addCase(createXpLedgerEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createXpLedgerEntry.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // Add new entry to the beginning of the list
        state.entries = [action.payload.entry, ...state.entries];
        state.userXpTotal = action.payload.newXpTotal;
        state.error = null;
      })
      .addCase(createXpLedgerEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearEntries } = xpLedgerSlice.actions;
export default xpLedgerSlice.reducer;
