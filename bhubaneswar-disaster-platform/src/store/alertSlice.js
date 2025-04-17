import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../utils/api';
import { saveDataLocally, getLocalData } from '../utils/offline';

export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/alerts');
      // Save alerts locally for offline access
      await saveDataLocally('alerts', response.data);
      return response.data;
    } catch (error) {
      // If online fetch fails, try to get cached data
      if (!navigator.onLine) {
        const localData = await getLocalData('alerts');
        if (localData.length > 0) {
          return localData;
        }
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markAlertAsSeen = createAsyncThunk(
  'alerts/markAsSeen',
  async (alertId, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/alerts/${alertId}/seen`);
      return { alertId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const alertSlice = createSlice({
  name: 'alerts',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setAlerts: (state, action) => {
      state.items = action.payload;
    },
    addAlert: (state, action) => {
      state.items.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAlertAsSeen.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (alert) => alert.alertId === action.payload.alertId
        );
        if (index !== -1) {
          state.items[index].seen = true;
        }
      });
  },
});

export const { setAlerts, addAlert } = alertSlice.actions;
export default alertSlice.reducer;