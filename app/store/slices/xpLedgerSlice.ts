import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { XpLedgerEntry, UserXpSummary, GrantManualXpRequest } from '@/lib/domain/models/xpLedger';
import { GrantManualXpResult } from '@/lib/utils/grantManualXp';
import { authHeaders } from '@/lib/utils/authHeaders';

interface XpLedgerState {
  entries: XpLedgerEntry[];
  summary: UserXpSummary;
  loading: boolean;
  error: string | null;
}

const EMPTY_SUMMARY: UserXpSummary = { xp_total: 0, level: 0, node: null, xp_into_level: null, xp_to_next: null };

const initialState: XpLedgerState = {
  entries: [],
  summary: EMPTY_SUMMARY,
  loading: false,
  error: null,
};

// Async thunks
export const fetchXpLedger = createAsyncThunk(
  'xpLedger/fetchByUid',
  async ({ uid, limit }: { uid: string; limit?: number }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/xp-ledger/${uid}?${params.toString()}`, { headers: authHeaders() });
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch XP ledger');
      }

      return data as { entries: XpLedgerEntry[]; summary: UserXpSummary };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const grantManualXp = createAsyncThunk(
  'xpLedger/grantManual',
  async (request: GrantManualXpRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/xp-ledger/grant-manual', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to grant XP');
      }

      return data as GrantManualXpResult;
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
      state.summary = EMPTY_SUMMARY;
    },
  },
  extraReducers: (builder) => {
    // Fetch XP Ledger
    builder
      .addCase(fetchXpLedger.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchXpLedger.fulfilled, (state, action: PayloadAction<{ entries: XpLedgerEntry[]; summary: UserXpSummary }>) => {
        state.loading = false;
        state.entries = action.payload.entries;
        state.summary = action.payload.summary;
        state.error = null;
      })
      .addCase(fetchXpLedger.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Grant manual XP
    builder
      .addCase(grantManualXp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(grantManualXp.fulfilled, (state, action: PayloadAction<GrantManualXpResult>) => {
        state.loading = false;
        state.summary = {
          xp_total: action.payload.xp_total,
          level: action.payload.level,
          node: action.payload.node,
          xp_into_level: action.payload.xp_into_level,
          xp_to_next: action.payload.xp_to_next,
        };
        state.error = null;
      })
      .addCase(grantManualXp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearEntries } = xpLedgerSlice.actions;
export default xpLedgerSlice.reducer;
