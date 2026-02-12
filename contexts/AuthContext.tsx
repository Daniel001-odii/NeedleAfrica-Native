import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import axiosInstance from '../lib/axios';
import { NotificationService } from '../services/NotificationService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

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
    smsAlerts?: boolean;
    emailNotifications?: boolean;
    marketingTips?: boolean;
    reminderDays?: string;
    measurementUnit?: 'cm' | 'inch';
    currency?: string;
    pushTokens?: string[];
    // Subscription fields
    subscriptionPlan?: 'FREE' | 'PRO' | 'STUDIO_AI';
    subscriptionStatus?: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'EXPIRED';
    subscriptionExpiry?: string;
    currentPlanCode?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isActionLoading: boolean;
    isNewUser: boolean; // Flag to trigger onboarding
    signIn: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signUp: (email: string, password: string, username: string, businessName: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (email: string, otp: string, password: string) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    deleteAccount: () => Promise<void>;
    completeOnboarding: () => void;
    refreshUser: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        checkUser();

        GoogleSignin.configure({
            webClientId: '818250734262-nj9ef9hbi560dkusujg5eta6l1bolrqr.apps.googleusercontent.com',
            iosClientId: '818250734262-na9hqkuq758b6id6gab1ohonot5qram9.apps.googleusercontent.com', // Optional for iOS if using Firebase
            offlineAccess: true,
        });
    }, []);

    const checkUser = async () => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            const userData = await SecureStore.getItemAsync('user_data');

            if (token && userData) {
                setUser(JSON.parse(userData));
                // Re-register push token on start to ensure it's up to date
                registerPushToken();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        setIsLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            // Get tokens to extract the access token required by the API
            const tokens = await GoogleSignin.getTokens();
            const accessToken = tokens.accessToken;

            if (!accessToken) {
                throw new Error('Failed to obtain Google access token');
            }

            const response = await axiosInstance.post('/auth/google', { accessToken });
            const { status, token, user: userData, message, isNewUser: isNew } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Google Login failed');
            }

            await SecureStore.setItemAsync('auth_token', token);
            await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
            setIsNewUser(!!isNew);
            setUser(userData);
            registerPushToken();
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Google Sign-In failed';
            throw new Error(errorMsg);
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
            setIsNewUser(false);
            setUser(userData);
            registerPushToken();
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
            setIsNewUser(true);
            setUser(userData);
            registerPushToken();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Sign up failed';
            console.log('Sign up error details:', error.response?.data || error.message);
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const forgotPassword = async (email: string) => {
        setIsActionLoading(true);
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
            setIsActionLoading(false);
        }
    };

    const resetPassword = async (email: string, otp: string, password: string) => {
        setIsActionLoading(true);
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
            setIsActionLoading(false);
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        setIsActionLoading(true);
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
            setIsActionLoading(false);
        }
    };

    const deleteAccount = async () => {
        setIsActionLoading(true);
        try {
            await axiosInstance.delete('/users/me');
            await logout();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Delete account failed';
            throw new Error(errorMsg);
        } finally {
            setIsActionLoading(false);
        }
    };

    const registerPushToken = async () => {
        try {
            const token = await NotificationService.registerForPushNotificationsAsync();
            if (token) {
                console.log('Push Token registered:', token);
                await axiosInstance.post('/users/push-token', { token });
            }
        } catch (error) {
            console.error('Failed to register push token:', error);
        }
    };

    const completeOnboarding = () => {
        setIsNewUser(false);
    };

    const refreshUser = async () => {
        try {
            const response = await axiosInstance.get('/users/me');
            const { status } = response.data;
            // console.log("user profile: ", response.data);
            // console.log("res status: ", status);
            if (status !== 'error') {
                const updatedUser = { ...response.data };
                await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_data');
        setIsNewUser(false);
        setUser(null);
        router.replace('/(auth)/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isActionLoading, isNewUser, signIn, logout, signUp, forgotPassword, resetPassword, updateProfile, deleteAccount, completeOnboarding, refreshUser, signInWithGoogle }}>
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
