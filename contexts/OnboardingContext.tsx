import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface OnboardingState {
    step: number;
    businessName: string;
    currency: string;
    businessType: string;
    phoneNumber: string;
    country: string;
    noOfEmployees: string;
    joinedFrom: string;
    customer: {
        id?: string;
        name: string;
        phone?: string;
        gender: string;
    } | null;
    template: {
        id?: string;
        name: string;
        fields: string[];
    } | null;
    measurement: {
        id?: string;
        values: Record<string, string>;
    } | null;
    order: {
        id?: string;
        styleName: string;
        amount: string;
        amountPaid: string;
        deliveryDate: string;
    } | null;
    isCompleted: boolean;
}

const initialState: OnboardingState = {
    step: 1,
    businessName: '',
    currency: 'NGN',
    businessType: '',
    phoneNumber: '',
    country: 'Nigeria',
    noOfEmployees: '1-5',
    joinedFrom: '',
    customer: null,
    template: null,
    measurement: null,
    order: null,
    isCompleted: false,
};

interface OnboardingContextType {
    state: OnboardingState;
    updateState: (updates: Partial<OnboardingState>) => void;
    nextStep: () => void;
    prevStep: () => void;
    resetOnboarding: () => void;
    isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = '@needlex_onboarding_state';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<OnboardingState>(initialState);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadState();
    }, []);

    const loadState = async () => {
        try {
            const savedState = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedState) {
                setState(JSON.parse(savedState));
            }
        } catch (error) {
            console.error('Failed to load onboarding state:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveState = async (newState: OnboardingState) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
            console.error('Failed to save onboarding state:', error);
        }
    };

    const updateState = (updates: Partial<OnboardingState>) => {
        setState(prev => {
            const newState = { ...prev, ...updates };
            saveState(newState);
            return newState;
        });
    };

    const nextStep = () => {
        const next = state.step + 1;
        updateState({ step: next });
        
        switch (next) {
            case 2: router.push('/onboarding/business'); break;
            case 3: router.push('/onboarding/customer'); break;
            case 4: router.push('/onboarding/measurements'); break;
            case 5: router.push('/onboarding/order'); break;
            case 6: router.push('/onboarding/completion'); break;
            default: break;
        }
    };

    const prevStep = () => {
        if (state.step > 1) {
            const prev = state.step - 1;
            updateState({ step: prev });
            router.back();
        }
    };

    const resetOnboarding = async () => {
        setState(initialState);
        await AsyncStorage.removeItem(STORAGE_KEY);
        router.replace('/onboarding');
    };

    return (
        <OnboardingContext.Provider value={{ state, updateState, nextStep, prevStep, resetOnboarding, isLoading }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
