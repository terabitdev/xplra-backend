import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Event } from '@/lib/domain/models/event';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface EventsState {
  events: Event[];
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  lastFetched: number | null;
}

const initialState: EventsState = {
  events: [],
  currentEvent: null,
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

interface FetchEventsParams {
  page?: number;
  limit?: number;
  fresh?: boolean;
}

interface FetchEventsResponse {
  data: Event[];
  pagination: PaginationInfo;
  cached: boolean;
}

export const fetchEvents = createAsyncThunk(
  'events/fetchAll',
  async (params: FetchEventsParams = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, fresh = false } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (fresh) queryParams.append('fresh', 'true');

      const response = await fetch(`/api/events/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch events');
      }

      return data as FetchEventsResponse;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/events/${id}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch event');
      }

      return data as Event;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/create',
  async (eventData: Partial<Event>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create event');
      }

      return data as Event;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/update',
  async (eventData: Event, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/events/${eventData.eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update event');
      }

      return eventData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/delete',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete event');
      }

      return eventId;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return rejectWithValue(errorMessage);
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    invalidateCache: (state) => {
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<FetchEventsResponse>) => {
        state.loading = false;
        state.events = action.payload.data;
        state.pagination = action.payload.pagination;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action: PayloadAction<Event>) => {
        state.loading = false;
        state.currentEvent = action.payload;
        state.error = null;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.loading = false;
        state.events.unshift(action.payload);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.loading = false;
        const index = state.events.findIndex((e) => e.eventId === action.payload.eventId);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.events = state.events.filter((e) => e.eventId !== action.payload);
        state.pagination.total -= 1;
        state.error = null;
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentEvent, setPage, invalidateCache } = eventsSlice.actions;
export default eventsSlice.reducer;
