import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './authSlice'; // Will create later

export const store = configureStore({
    reducer: {
        // auth: authReducer,
    },
});
