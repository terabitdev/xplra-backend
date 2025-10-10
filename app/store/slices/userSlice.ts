import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    uid: string | null;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    type: string | null;
    loading: boolean;
    error: string | null;
    isEditModalOpen: boolean;
    isSaving: boolean;
}

const initialState: UserState = {
    uid: null,
    email: null,
    displayName: null,
    photoURL: null,
    type: null,
    loading: false,
    error: null,
    isEditModalOpen: false,
    isSaving: false,
};

// Async thunk to fetch user profile
export const fetchUserProfile = createAsyncThunk(
    'user/fetchProfile',
    async (token: string, { rejectWithValue, getState }) => {
        try {
            // Check if user data already exists in state to avoid redundant API calls
            const state = getState() as { user: UserState };
            if (state.user.email && state.user.uid) {
                return state.user;
            }

            const res = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const data = await res.json();
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk to update user profile
export const updateUserProfile = createAsyncThunk(
    'user/updateProfile',
    async ({ token, displayName, photo }: { token: string; displayName: string; photo?: File }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('displayName', displayName);
            if (photo) {
                formData.append('photo', photo);
            }

            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await res.json();
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setEditModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isEditModalOpen = action.payload;
        },
        clearUser: (state) => {
            state.uid = null;
            state.email = null;
            state.displayName = null;
            state.photoURL = null;
            state.type = null;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch user profile
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.uid = action.payload.uid;
                state.email = action.payload.email;
                state.displayName = action.payload.displayName || action.payload.email?.split('@')[0] || 'User';
                state.photoURL = action.payload.photoURL;
                state.type = action.payload.type;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update user profile
            .addCase(updateUserProfile.pending, (state) => {
                state.isSaving = true;
                state.error = null;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.isSaving = false;
                state.displayName = action.payload.displayName;
                state.photoURL = action.payload.photoURL;
                state.isEditModalOpen = false;
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.isSaving = false;
                state.error = action.payload as string;
            });
    },
});

export const { setEditModalOpen, clearUser } = userSlice.actions;
export default userSlice.reducer;
