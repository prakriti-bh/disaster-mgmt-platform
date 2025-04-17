import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../utils/api';
import { saveDataLocally, getLocalData, queueOfflineAction } from '../utils/offline';

export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/reports');
      // Save reports locally for offline access
      await saveDataLocally('reports', response.data);
      return response.data;
    } catch (error) {
      // If online fetch fails, try to get cached data
      if (!navigator.onLine) {
        const localData = await getLocalData('reports');
        if (localData.length > 0) {
          return localData;
        }
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const submitReport = createAsyncThunk(
  'reports/submitReport',
  async (reportData, { rejectWithValue, getState }) => {
    try {
      // Add user info if not anonymous
      if (!reportData.isAnonymous) {
        const { user } = getState().user;
        if (user) {
          reportData.user = {
            userId: user.userId,
            name: user.name,
          };
        }
      }
      
      // Generate a local ID for offline mode
      const localReportId = `local-${Date.now()}`;
      
      if (!navigator.onLine) {
        // Queue action for when back online
        await queueOfflineAction('submitReport', reportData);
        
        // Save locally with temporary ID
        const reportWithId = { ...reportData, reportId: localReportId, isPending: true };
        await saveDataLocally('reports', reportWithId);
        
        return reportWithId;
      }
      
      const response = await apiClient.post('/reports', reportData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    items: [],
    loading: false,
    error: null,
    submitting: false,
    submitError: null,
  },
  reducers: {
    setReports: (state, action) => {
      state.items = action.payload;
    },
    addReport: (state, action) => {
      state.items.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        // Merge with existing items, keeping pending ones
        const pendingReports = state.items.filter(item => item.isPending);
        state.items = [...action.payload, ...pendingReports];
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(submitReport.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(submitReport.fulfilled, (state, action) => {
        state.submitting = false;
        state.items.unshift(action.payload);
      })
      .addCase(submitReport.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      });
  },
});

export const { setReports, addReport } = reportSlice.actions;
export default reportSlice.reducer;