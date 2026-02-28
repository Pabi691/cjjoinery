import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './authSlice'; // Will create later

export const store = configureStore({
    reducer: {
        // Placeholder reducer to prevent "Store does not have a valid reducer" error
        _persist: (state = {}) => state,
    },
});
