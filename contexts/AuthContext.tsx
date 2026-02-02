import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import axiosInstance from '../lib/axios';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface User {
    id: string;
    email: string;
    username: string;
    businessName: string;
    phoneNumber?: string;
    address?: string;
    profilePicture?: string;
    role: string;
    token?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signUp: (email: string, password: string, username: string, businessName: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (email: string, otp: string, password: string) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            const userData = await SecureStore.getItemAsync('user_data');

            if (token && userData) {
                setUser(JSON.parse(userData));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/auth/login', { email, password });
            const { status, token, user: userData, message } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Login failed');
            }

            await SecureStore.setItemAsync('auth_token', token);
            await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
            setUser(userData);
            router.replace('/(tabs)');
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Sign in failed';
            console.log('Sign in error details:', error.response?.data || error.message);
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (email: string, password: string, username: string, businessName: string) => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/auth/register', { email, password, username, businessName });
            const { status, token, user: userData, message } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Registration failed');
            }

            if (token) {
                await SecureStore.setItemAsync('auth_token', token);
            }
            await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
            setUser(userData);
            router.replace('/(tabs)');
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Sign up failed';
            console.log('Sign up error details:', error.response?.data || error.message);
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const forgotPassword = async (email: string) => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/auth/forgot-password', { email });
            const { status, message } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Failed to send OTP');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Forgot password failed';
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (email: string, otp: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/auth/reset-password', { email, otp, password });
            const { status, message } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Password reset failed');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Reset password failed';
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.put('/users/me', data);
            const { status, user: userData, message } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Update failed');
            }

            const updatedUser = { ...user, ...userData };
            await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Update failed';
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteAccount = async () => {
        setIsLoading(true);
        try {
            await axiosInstance.delete('/users/me');
            await logout();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Delete account failed';
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_data');
        setUser(null);
        router.replace('/(auth)/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, logout, signUp, forgotPassword, resetPassword, updateProfile, deleteAccount }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
