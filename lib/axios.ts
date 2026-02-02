import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use localhost for Android emulator (10.0.2.2) or local IP, 
// or the production URL if available.
// const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://needle-africa-api.vercel.app/api';
const API_URL = 'https://needle-africa-api.vercel.app/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
