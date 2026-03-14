import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ValidationConfig } from '@/lib/domain/models/validationConfig';

interface ValidationConfigsState {
  configs: ValidationConfig[];
  currentConfig: ValidationConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: ValidationConfigsState = {
  configs: [],
  currentConfig: null,
  loading: false,
  error: null,
};

export const fetchValidationConfigs = createAsyncThunk(
  'validationConfigs/fetchAll',
  async (params: { fresh?: boolean } | undefined, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.fresh) queryParams.set('fresh', 'true');

      const url = `/api/validation-configs/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch validation configs');
      }

      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchValidationConfigById = createAsyncThunk(
  'validationConfigs/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/validation-configs/${id}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch validation config');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createValidationConfig = createAsyncThunk(
  'validationConfigs/create',
  async (configData: Partial<ValidationConfig>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/validation-configs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create validation config');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateValidationConfig = createAsyncThunk(
  'validationConfigs/update',
  async ({ id, configData }: { id: string; configData: Partial<ValidationConfig> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/validation-configs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update validation config');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteValidationConfig = createAsyncThunk(
  'validationConfigs/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/validation-configs/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete validation config');
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const validationConfigsSlice = createSlice({
  name: 'validationConfigs',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentConfig: (state) => {
      state.currentConfig = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchValidationConfigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchValidationConfigs.fulfilled, (state, action: PayloadAction<ValidationConfig[]>) => {
        state.loading = false;
        state.configs = action.payload;
        state.error = null;
      })
      .addCase(fetchValidationConfigs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch By ID
    builder
      .addCase(fetchValidationConfigById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchValidationConfigById.fulfilled, (state, action: PayloadAction<ValidationConfig>) => {
        state.loading = false;
        state.currentConfig = action.payload;
        state.error = null;
      })
      .addCase(fetchValidationConfigById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create
    builder
      .addCase(createValidationConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createValidationConfig.fulfilled, (state, action: PayloadAction<ValidationConfig>) => {
        state.loading = false;
        state.configs.unshift(action.payload);
        state.error = null;
      })
      .addCase(createValidationConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update
    builder
      .addCase(updateValidationConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateValidationConfig.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.config;
        const index = state.configs.findIndex((c) => c.id === updated.id);
        if (index !== -1) {
          state.configs[index] = { ...state.configs[index], ...updated };
        }
        state.error = null;
      })
      .addCase(updateValidationConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete
    builder
      .addCase(deleteValidationConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteValidationConfig.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.configs = state.configs.filter((c) => c.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteValidationConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentConfig } = validationConfigsSlice.actions;
export default validationConfigsSlice.reducer;
