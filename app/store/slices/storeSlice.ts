import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { StoreItem } from '@/lib/domain/models/storeItem';

interface StoreState {
  items: StoreItem[];
  currentItem: StoreItem | null;
  loading: boolean;
  error: string | null;
}

const initialState: StoreState = {
  items: [],
  currentItem: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchStoreItems = createAsyncThunk(
  'store/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/store/list');
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch store items');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchStoreItemById = createAsyncThunk(
  'store/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/store/${id}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch store item');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createStoreItem = createAsyncThunk(
  'store/create',
  async (itemData: Partial<StoreItem>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/store/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create store item');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateStoreItem = createAsyncThunk(
  'store/update',
  async ({ id, itemData }: { id: string; itemData: Partial<StoreItem> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/store/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update store item');
      }

      return { id, ...data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteStoreItem = createAsyncThunk(
  'store/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/store/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete store item');
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Slice
const storeSlice = createSlice({
  name: 'store',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentItem: (state) => {
      state.currentItem = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Store Items
    builder
      .addCase(fetchStoreItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoreItems.fulfilled, (state, action: PayloadAction<StoreItem[]>) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchStoreItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Store Item By ID
    builder
      .addCase(fetchStoreItemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoreItemById.fulfilled, (state, action: PayloadAction<StoreItem>) => {
        state.loading = false;
        state.currentItem = action.payload;
        state.error = null;
      })
      .addCase(fetchStoreItemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Store Item
    builder
      .addCase(createStoreItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStoreItem.fulfilled, (state, action: PayloadAction<StoreItem>) => {
        state.loading = false;
        state.items.push(action.payload);
        state.error = null;
      })
      .addCase(createStoreItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Store Item
    builder
      .addCase(updateStoreItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStoreItem.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
        state.error = null;
      })
      .addCase(updateStoreItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Store Item
    builder
      .addCase(deleteStoreItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStoreItem.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteStoreItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentItem } = storeSlice.actions;
export default storeSlice.reducer;
