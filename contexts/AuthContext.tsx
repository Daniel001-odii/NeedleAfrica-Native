import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface User {
    id: string;
    email: string;
    name: string;
    photo?: string;
    token?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
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
        // Dummy implementation
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            const dummyUser = {
                id: '123',
                email,
                name: 'Test User',
                token: 'dummy-token'
            };

            await SecureStore.setItemAsync('auth_token', dummyUser.token);
            await SecureStore.setItemAsync('user_data', JSON.stringify(dummyUser));
            setUser(dummyUser);
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (email: string, password: string, name: string) => {
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const dummyUser = {
                id: '123',
                email,
                name,
                token: 'dummy-token'
            };
            await SecureStore.setItemAsync('auth_token', dummyUser.token);
            await SecureStore.setItemAsync('user_data', JSON.stringify(dummyUser));
            setUser(dummyUser);
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        // Placeholder for Google Auth Implementation
        console.log('Google Sign In');
        // Implement actual Google Sign In using expo-auth-session
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_data');
        setUser(null);
        router.replace('/(auth)/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, logout, signUp, signInWithGoogle }}>
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
