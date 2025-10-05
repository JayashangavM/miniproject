import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Get all courses
export const getCourses = createAsyncThunk(
  'courses/getCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/courses');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get single course
export const getCourse = createAsyncThunk(
  'courses/getCourse',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/courses/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Create course
export const createCourse = createAsyncThunk(
  'courses/createCourse',
  async (courseData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post('/api/courses', courseData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Enroll in course
export const enrollCourse = createAsyncThunk(
  'courses/enrollCourse',
  async (courseId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(`/api/courses/${courseId}/enroll`, {}, config);
      return { ...response.data, courseId };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  courses: [],
  course: null,
  loading: false,
  error: null,
  success: false
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearCourseError: (state) => {
      state.error = null;
    },
    clearCourseSuccess: (state) => {
      state.success = false;
    },
    resetCourse: (state) => {
      state.course = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all courses
      .addCase(getCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.data;
      })
      .addCase(getCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ? action.payload.message : 'Failed to fetch courses';
      })
      // Get single course
      .addCase(getCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.course = action.payload.data;
      })
      .addCase(getCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ? action.payload.message : 'Failed to fetch course';
      })
      // Create course
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.courses.push(action.payload.data);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ? action.payload.message : 'Failed to create course';
      })
      // Enroll in course
      .addCase(enrollCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(enrollCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(enrollCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ? action.payload.message : 'Failed to enroll in course';
      });
  }
});

export const { clearCourseError, clearCourseSuccess, resetCourse } = courseSlice.actions;
export default courseSlice.reducer;