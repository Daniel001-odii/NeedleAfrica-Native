import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Typography } from './ui/Typography';
import { Surface } from './ui/Surface';
import { TickCircle, ArrowRight2 } from 'iconsax-react-native';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useRouter } from 'expo-router';

export function OnboardingChecklist() {
    const { state } = useOnboarding();
    const router = useRouter();

    const steps = [
        { id: 1, title: 'Workspace Setup', key: 'businessName', route: '/onboarding' },
        { id: 2, title: 'Add First Customer', key: 'customer', route: '/onboarding/customer' },
        { id: 3, title: 'Add Measurements', key: 'measurement', route: '/onboarding/measurements' },
        { id: 4, title: 'Create First Order', key: 'order', route: '/onboarding/order' },
    ];

    const isStepComplete = (stepKey: string) => {
        if (stepKey === 'businessName') return !!state.businessName;
        return !!state[stepKey as keyof typeof state];
    };

    return (
        <Surface rounded="3xl" className="p-6 mb-8">
            <Typography variant="h3" weight="bold" className="mb-4">Getting Started</Typography>
            <Typography color="gray" className="mb-6">Complete these steps to set up your NeedleX workspace.</Typography>

            <View>
                {steps.map((step) => {
                    const completed = isStepComplete(step.key);
                    const isCurrent = state.step === step.id;

                    return (
                        <TouchableOpacity
                            key={step.id}
                            onPress={() => router.push(step.route as any)}
                            className={`flex-row items-center p-4 mb-3 rounded-2xl border ${completed ? 'bg-blue-50/50 border-blue-100' : 'bg-transparent border-gray-100'}`}
                        >
                            <View className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${completed ? 'bg-blue-500' : 'bg-gray-100'}`}>
                                {completed ? (
                                    <TickCircle size={18} color="white" variant="Bold" />
                                ) : (
                                    <Typography variant="small" weight="bold" color="gray">{step.id}</Typography>
                                )}
                            </View>
                            
                            <View className="flex-1">
                                <Typography
                                    variant="body"
                                    weight={completed ? "bold" : "semibold"}
                                    color={completed ? "primary" : (isCurrent ? "black" : "gray")}
                                >
                                    {step.title}
                                </Typography>
                            </View>

                            {!completed && (
                                <ArrowRight2 size={16} color="#9CA3AF" />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Surface>
    );
}
