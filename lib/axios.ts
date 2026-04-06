import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// Environment switcher
const ENV = (process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'staging' | 'production') || (__DEV__ ? 'development' : 'production'); // Use env variable if provided, otherwise fallback based on build mode

const API_CONFIG = {
    development: 'http://192.168.65.147:3000/api',
    staging: 'http://192.168.1.101:3000/api', // Pointing to local for both dev/staging as requested
    production: 'https://needle-africa-api.vercel.app/api'
};

// const API_URL = Constants.expoConfig?.extra?.rootApiUrl || API_CONFIG[ENV];
const API_URL = API_CONFIG[ENV];

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

// Response interceptor to handle token invalidation
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token is invalid or expired, clear auth data and redirect to login
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('user_data');
            router.replace('/(auth)/login');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
