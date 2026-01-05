import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Place } from '@/lib/domain/models/place';

interface PlacesState {
  places: Place[];
  currentPlace: Place | null;
  loading: boolean;
  error: string | null;
}

const initialState: PlacesState = {
  places: [],
  currentPlace: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchPlaces = createAsyncThunk(
  'places/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/places/list');
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch places');
      }

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPlaceById = createAsyncThunk(
  'places/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/places/${id}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch place');
      }

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createPlace = createAsyncThunk(
  'places/create',
  async ({ placeData, imageFiles }: { placeData: Partial<Place>, imageFiles: File[] }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('placeData', JSON.stringify(placeData));

      // Append image files
      imageFiles.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });

      const response = await fetch('/api/places/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create place');
      }

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updatePlace = createAsyncThunk(
  'places/update',
  async ({ placeData, imageFiles }: { placeData: Place, imageFiles: File[] }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('placeData', JSON.stringify(placeData));

      // Append image files
      imageFiles.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });

      const response = await fetch(`/api/places/${placeData.placeId}`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update place');
      }

      return placeData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deletePlace = createAsyncThunk(
  'places/delete',
  async (placeId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/places/${placeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete place');
      }

      return placeId;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

// Slice
const placesSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPlace: (state) => {
      state.currentPlace = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Places
    builder
      .addCase(fetchPlaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlaces.fulfilled, (state, action: PayloadAction<Place[]>) => {
        state.loading = false;
        state.places = action.payload;
        state.error = null;
      })
      .addCase(fetchPlaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Place By ID
    builder
      .addCase(fetchPlaceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlaceById.fulfilled, (state, action: PayloadAction<Place>) => {
        state.loading = false;
        state.currentPlace = action.payload;
        state.error = null;
      })
      .addCase(fetchPlaceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Place
    builder
      .addCase(createPlace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPlace.fulfilled, (state, action: PayloadAction<Place>) => {
        state.loading = false;
        state.places.push(action.payload);
        state.error = null;
      })
      .addCase(createPlace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Place
    builder
      .addCase(updatePlace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePlace.fulfilled, (state, action: PayloadAction<Place>) => {
        state.loading = false;
        const index = state.places.findIndex((place) => place.placeId === action.payload.placeId);
        if (index !== -1) {
          state.places[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updatePlace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Place
    builder
      .addCase(deletePlace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePlace.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.places = state.places.filter((place) => place.placeId !== action.payload);
        state.error = null;
      })
      .addCase(deletePlace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentPlace } = placesSlice.actions;
export default placesSlice.reducer;
