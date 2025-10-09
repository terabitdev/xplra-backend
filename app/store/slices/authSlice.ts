import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User {
  uid: string;
  email: string | null;
  token: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunks
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Sign in failed');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Sign up failed');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const validateSession = createAsyncThunk(
  'auth/validateSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        localStorage.removeItem('token');
        return rejectWithValue(data.error || 'Session validation failed');
      }

      return { ...data, token };
    } catch (error: any) {
      localStorage.removeItem('token');
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Password reset failed');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  localStorage.removeItem('token');
  return null;
});

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Sign In
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = {
          uid: action.payload.uid,
          email: action.payload.email,
          token: action.payload.token,
        };
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Sign Up
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = {
          uid: action.payload.uid,
          email: action.payload.email,
          token: action.payload.token,
        };
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Validate Session
    builder
      .addCase(validateSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(validateSession.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = {
          uid: action.payload.uid,
          email: action.payload.email,
          token: action.payload.token,
        };
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(validateSession.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Sign Out
    builder
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
