import React from 'react';
import { View, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import Svg, { Circle } from 'react-native-svg';
import { ArrowLeft } from 'iconsax-react-native';

const { width } = Dimensions.get('window');

interface OnboardingIntroScreenProps {
    title: string;
    subtitle: string;
    stepIndex: number; // 1 to 5
    buttonText: string;
    onNext: () => void;
    onBack?: () => void;
    onSkip?: () => void;
    illustrationType: 'workspace' | 'business' | 'customer' | 'measurements' | 'order';
}

const ILLUSTRATION_IMAGES = {
    workspace: require('../assets/illustrations/catalog.png'),
    business: require('../assets/illustrations/business.png'),
    customer: require('../assets/illustrations/customers.png'),
    measurements: require('../assets/illustrations/templates.png'),
    order: require('../assets/illustrations/orders.png'),
};

export function OnboardingIntroScreen({
    title,
    subtitle,
    stepIndex,
    buttonText,
    onNext,
    onBack,
    onSkip,
    illustrationType
}: OnboardingIntroScreenProps) {

    return (
        <View className="flex-1 justify-between p-4 pt-4 pb-6">
            {/* Header Area */}
            <View className="flex-row justify-between items-center h-10 w-full">
                {onBack ? (
                    <TouchableOpacity onPress={onBack} className="p-2 -ml-2 rounded-full active:bg-gray-100/50">
                        <ArrowLeft size={24} color="#6B3A52" />
                    </TouchableOpacity>
                ) : (
                    <View className="w-10" />
                )}

                {onSkip ? (
                    <TouchableOpacity onPress={onSkip} className="px-3 py-1.5 rounded-full active:bg-gray-100/50">
                        <Typography color="primary" weight="bold" className="text-[15px]">
                            Skip
                        </Typography>
                    </TouchableOpacity>
                ) : (
                    <View className="w-10" />
                )}
            </View>

            {/* Content Area */}
            <View className="flex-1 justify-center items-center my-6">
                {/* Descriptive Copy */}
                <View className="items-center px-4 mb-8">
                    <Typography
                        variant="h1"
                        weight="extrabold"
                        className="text-center text-[#21000A] text-[28px] leading-8 tracking-tight mb-3"
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="subtitle"
                        color="gray"
                        className="text-center text-[#6B3A52] leading-5 text-[15px]"
                    >
                        {subtitle}
                    </Typography>
                </View>

                {/* Centered Illustration */}
                <View className="w-[280px] h-[280px] rounded-full bg-white items-center justify-center shadow-sm border border-gray-100 overflow-hidden relative">
                    {/* Background rings */}
                    <View className="absolute inset-0 items-center justify-center opacity-[0.04]">
                        <Svg width="320" height="320" viewBox="0 0 320 320">
                            <Circle cx="160" cy="160" r="140" stroke="#FF5678" strokeWidth="2" fill="none" />
                            <Circle cx="160" cy="160" r="100" stroke="#FF5678" strokeWidth="2" fill="none" />
                            <Circle cx="160" cy="160" r="60" stroke="#FF5678" strokeWidth="2" fill="none" />
                        </Svg>
                    </View>

                    <Image
                        source={ILLUSTRATION_IMAGES[illustrationType]}
                        style={{ width: 220, height: 220 }}
                        resizeMode="contain"
                    />
                </View>
            </View>

            {/* Bottom Actions Area */}
            <View className="w-full items-center">
                {/* Pagination Dots */}
                <View className="flex-row gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((i) => {
                        const isActive = i === stepIndex;
                        return (
                            <View
                                key={i}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    isActive ? 'w-6 bg-[#FF5678]' : 'w-2 bg-[#EAE1DC]'
                                }`}
                            />
                        );
                    })}
                </View>

                {/* Continue button */}
                <Button
                    onPress={onNext}
                    className="w-full h-14 rounded-full bg-[#FF5678] border-0 active:scale-98 shadow-none"
                    textClassName="text-white text-lg font-bold"
                >
                    {buttonText}
                </Button>
            </View>
        </View>
    );
}
