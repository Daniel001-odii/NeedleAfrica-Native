import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import axiosInstance from '../lib/axios';
import { Platform } from 'react-native';
import { NotificationService } from '../services/NotificationService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import { revenueCatService } from '../services/RevenueCatService';
import { posthog } from '../posthogConfig';
import Constants from 'expo-constants';
import { database } from '../database/watermelon';

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
    theme?: 'light' | 'dark' | 'system';
    pushTokens?: string[];
    country?: string;
    noOfEmployees?: string;
    businessType?: string;
    joinedFrom?: string;
    currency?: string;
    // Subscription fields
    subscriptionPlan?: 'FREE' | 'PRO' | 'STUDIO_AI';
    subscriptionStatus?: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'EXPIRED';
    subscriptionExpiry?: string;
    currentPlanCode?: string;
    deviceType?: string;
    onboardingCompleted?: boolean;
    invoiceTemplate?: number;
    provider?: 'NEEDLEX' | 'GOOGLE' | 'APPLE';
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
    updateProfile: (data: Partial<User>) => Promise<User>;
    uploadProfilePhoto: (imageUri: string) => Promise<User>;
    deleteAccount: () => Promise<void>;
    completeOnboarding: () => void;
    refreshUser: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
            webClientId: Constants.expoConfig?.extra?.googleWebClientId || process.env.EXPO_PUBLIC_WEB_ID,
            iosClientId: Constants.expoConfig?.extra?.googleIosClientId || process.env.EXPO_PUBLIC_IOS_ID,
            offlineAccess: true,
        });
    }, []);

    const checkUser = async () => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            const userData = await SecureStore.getItemAsync('user_data');

            if (token && userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsNewUser(!parsedUser.onboardingCompleted);
                // Re-register push token on start to ensure it's up to date
                registerPushToken();

                // PostHog Identity
                posthog.identify(parsedUser.id, {
                    email: parsedUser.email,
                    username: parsedUser.username,
                    businessName: parsedUser.businessName
                });

                // Set RevenueCat user ID for returning users
                try {
                    revenueCatService.setUserId(parsedUser.id);
                } catch (rcError) {
                    console.error('Failed to set RevenueCat user ID on mount:', rcError);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        setIsActionLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            // Get tokens to extract the access token required by the API
            const tokens = await GoogleSignin.getTokens();
            const accessToken = tokens.accessToken;

            if (!accessToken) {
                throw new Error('Failed to obtain Google access token');
            }

            const response = await axiosInstance.post('/auth/google', { 
                accessToken,
                deviceType: Platform.OS 
            });
            const { status, token, user: userData, message, isNewUser: isNew } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Google Login failed');
            }

            await SecureStore.setItemAsync('auth_token', token);
            await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
            await database.write(async () => {
                await database.unsafeResetDatabase();
            });
            setIsNewUser(!userData.onboardingCompleted);
            setUser(userData);
            registerPushToken();

            // PostHog Identity & Capture
            posthog.identify(userData.id, {
                email: userData.email,
                username: userData.username,
                method: 'google'
            });
            posthog.capture('user_login', { method: 'google', isNewUser: !!isNew });

            // Initialize RevenueCat with user ID
            try {
                await revenueCatService.setUserId(userData.id);
            } catch (rcError) {
                console.error('Failed to set RevenueCat user ID:', rcError);
            }
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Google Sign-In failed';
            throw new Error(errorMsg);
        } finally {
            setIsActionLoading(false);
        }
    };

    const signInWithApple = async () => {
        setIsActionLoading(true);
        try {
            // Start the sign-in request
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
            });

            const { identityToken, user: appleUser } = appleAuthRequestResponse;

            if (!identityToken) {
                throw new Error('No identityToken received from Apple');
            }

            // Send to backend
            const response = await axiosInstance.post('/auth/apple', {
                identityToken,
                user: appleUser, // Contains name/email on first sign-in
                deviceType: Platform.OS
            });

            const { status, token, user: userData, message, isNewUser: isNew } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Apple Login failed');
            }

            await SecureStore.setItemAsync('auth_token', token);
            await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
            await database.write(async () => {
                await database.unsafeResetDatabase();
            });
            setIsNewUser(!userData.onboardingCompleted);
            setUser(userData);
            registerPushToken();

            // PostHog Identity & Capture
            posthog.identify(userData.id, {
                email: userData.email,
                username: userData.username,
                method: 'apple'
            });
            posthog.capture('user_login', { method: 'apple', isNewUser: !!isNew });

            // Initialize RevenueCat with user ID
            try {
                await revenueCatService.setUserId(userData.id);
            } catch (rcError) {
                console.error('Failed to set RevenueCat user ID:', rcError);
            }
        } catch (error: any) {
            console.error('Apple Sign-In Error:', error);
            if (error.code === appleAuth.Error.CANCELED) {
                console.log('User canceled Apple Sign-in');
                return; // Silence cancellation errors
            }
            const errorMsg = error.response?.data?.message || error.message || 'Apple Sign-In failed';
            throw new Error(errorMsg);
        } finally {
            setIsActionLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.post('/auth/login', { 
                email, 
                password,
                deviceType: Platform.OS
            });
            const { status, token, user: userData, message } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Login failed');
            }

            await SecureStore.setItemAsync('auth_token', token);
            await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
            await database.write(async () => {
                await database.unsafeResetDatabase();
            });
            setIsNewUser(!userData.onboardingCompleted);
            setUser(userData);
            registerPushToken();

            // PostHog Identity & Capture
            posthog.identify(userData.id, {
                email: userData.email,
                username: userData.username,
                method: 'email'
            });
            posthog.capture('user_login', { method: 'email' });

            // Initialize RevenueCat with user ID
            try {
                await revenueCatService.setUserId(userData.id);
            } catch (rcError) {
                console.error('Failed to set RevenueCat user ID:', rcError);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Sign in failed';
            console.log('Sign in error details:', error.response?.data || error.message);
            throw new Error(errorMsg);
        } finally {
            setIsActionLoading(false);
        }
    };

    const signUp = async (email: string, password: string, username: string, businessName: string) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.post('/auth/register', { 
                email, 
                password, 
                username, 
                businessName,
                deviceType: Platform.OS
            });
            const { status, token, user: userData, message } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Registration failed');
            }

            if (token) {
                await SecureStore.setItemAsync('auth_token', token);
            }
            await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
            setIsNewUser(!userData.onboardingCompleted);
            setUser(userData);
            registerPushToken();

            // PostHog Identity & Capture
            posthog.identify(userData.id, {
                email: userData.email,
                username: userData.username,
                businessName: userData.businessName
            });
            posthog.capture('user_signup', { method: 'email' });

            // Initialize RevenueCat with user ID
            try {
                await revenueCatService.setUserId(userData.id);
            } catch (rcError) {
                console.error('Failed to set RevenueCat user ID:', rcError);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Sign up failed';
            console.log('Sign up error details:', error.response?.data || error.message);
            throw new Error(errorMsg);
        } finally {
            setIsActionLoading(false);
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
            return updatedUser;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Update failed';
            throw new Error(errorMsg);
        } finally {
            setIsActionLoading(false);
        }
    };

    const changePassword = async (currentPassword: string, newPassword: string) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.post('/auth/change-password', { currentPassword, newPassword });
            const { status, message } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Password change failed');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Password change failed';
            throw new Error(errorMsg);
        } finally {
            setIsActionLoading(false);
        }
    };

    const uploadProfilePhoto = async (imageUri: string) => {
        setIsActionLoading(true);
        try {
            // Read file as base64 using expo-file-system
            const { File } = await import('expo-file-system');
            const file = new File(imageUri);
            const base64 = await file.base64();
            
            const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
            const dataUrl = `data:${mimeType};base64,${base64}`;

            const response = await axiosInstance.post('/users/me/photo', { image: dataUrl });
            const { status, user: userData, message } = response.data;

            if (status === 'error') {
                throw new Error(message || 'Photo upload failed');
            }

            const updatedUser = { ...user, ...userData };
            await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return updatedUser;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Photo upload failed';
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

    const completeOnboarding = async () => {
        try {
            const response = await axiosInstance.put('/users/me', { onboardingCompleted: true });
            if (response.data.status !== 'error') {
                const updatedUser = { ...user, ...response.data.user, onboardingCompleted: true };
                await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setIsNewUser(false);
            }
        } catch (error) {
            console.error('Failed to complete onboarding:', error);
        }
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
                setIsNewUser(!updatedUser.onboardingCompleted);
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const logout = async () => {
        // Logout from RevenueCat first
        try {
            await revenueCatService.logout();
        } catch (rcError) {
            console.error('Failed to logout from RevenueCat:', rcError);
        }

        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_data');
        setIsNewUser(false);
        setUser(null);
        posthog.reset();
        router.replace('/(auth)/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isActionLoading, isNewUser, signIn, logout, signUp, forgotPassword, resetPassword, updateProfile, uploadProfilePhoto, deleteAccount, completeOnboarding, refreshUser, signInWithGoogle, signInWithApple, changePassword }}>
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
