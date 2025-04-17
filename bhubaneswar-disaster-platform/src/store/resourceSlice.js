import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../utils/api';
import { saveDataLocally, getLocalData, queueOfflineAction } from '../utils/offline';

export const fetchResources = createAsyncThunk(
  'resources/fetchResources',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/resources');
      // Save resources locally for offline access
      await saveDataLocally('resources', response.data);
      return response.data;
    } catch (error) {
      // If online fetch fails, try to get cached data
      if (!navigator.onLine) {
        const localData = await getLocalData('resources');
        if (localData.length > 0) {
          return localData;
        }
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateResourceStatus = createAsyncThunk(
  'resources/updateStatus',
  async ({ resourceId, status, capacity }, { rejectWithValue }) => {
    try {
      const updateData = { operationalStatus: status };
      if (capacity) {
        updateData.capacity = capacity;
      }
      
      if (!navigator.onLine) {
        // Queue action for when back online
        await queueOfflineAction('updateResource', { resourceId, ...updateData });
        // Update local state immediately
        return { resourceId, data: updateData };
      }
      
      const response = await apiClient.patch(`/resources/${resourceId}`, updateData);
      return { resourceId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const resourceSlice = createSlice({
  name: 'resources',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setResources: (state, action) => {
      state.items = action.payload;
    },
    addResource: (state, action) => {
      state.items.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateResourceStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (resource) => resource.resourceId === action.payload.resourceId
        );
        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...action.payload.data,
            lastUpdated: new Date().toISOString(),
          };
        }
      });
  },
});

export const { setResources, addResource } = resourceSlice.actions;
export default resourceSlice.reducer;