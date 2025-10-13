import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FilterState {
  selectedCategory: string | null;
  selectedTriggerType: string | null;
}

const initialState: FilterState = {
  selectedCategory: null,
  selectedTriggerType: null,
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    setSelectedTriggerType: (state, action: PayloadAction<string | null>) => {
      state.selectedTriggerType = action.payload;
    },
    clearFilters: (state) => {
      state.selectedCategory = null;
      state.selectedTriggerType = null;
    },
    clearTriggerFilter: (state) => {
      state.selectedTriggerType = null;
    },
  },
});

export const { setSelectedCategory, setSelectedTriggerType, clearFilters, clearTriggerFilter } = filterSlice.actions;
export default filterSlice.reducer;
