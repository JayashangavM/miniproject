import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch progress for a course
export const getProgressByCourse = createAsyncThunk(
  'progress/getByCourse',
  async (courseId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`/api/progress/course/${courseId}`, config);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to load progress' });
    }
  }
);

// Mark a material as completed
export const completeMaterial = createAsyncThunk(
  'progress/completeMaterial',
  async (materialId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`/api/progress/material/${materialId}/complete`, {}, config);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to update progress' });
    }
  }
);

const progressSlice = createSlice({
  name: 'progress',
  initialState: {
    byCourse: {}, // key: courseId -> progress object
    loading: false,
    error: null,
  },
  reducers: {
    clearProgressError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProgressByCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProgressByCourse.fulfilled, (state, action) => {
        state.loading = false;
        const progress = action.payload.data;
        state.byCourse[progress.course] = progress;
      })
      .addCase(getProgressByCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load progress';
      })
      .addCase(completeMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeMaterial.fulfilled, (state, action) => {
        state.loading = false;
        const progress = action.payload.data;
        state.byCourse[progress.course] = progress;
      })
      .addCase(completeMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update progress';
      });
  }
});

export const { clearProgressError } = progressSlice.actions;
export default progressSlice.reducer;
