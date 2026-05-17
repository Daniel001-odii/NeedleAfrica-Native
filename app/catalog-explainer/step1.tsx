import React from 'react';
import { View, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'iconsax-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function CatalogStep1() {
    const router = useRouter();
    const { isDark } = useTheme();

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <View className="flex-1 justify-between px-5 pb-8">
                {/* Header Back Button */}
                <View className="flex-row items-center justify-between h-12 w-full">
                    <TouchableOpacity
                        onPress={() => router.replace('/(tabs)/profile')}
                        className="w-10 h-10 items-center justify-center"
                    >
                        <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                    </TouchableOpacity>
                    <View className="w-10" />
                </View>

                {/* Content Area */}
                <View className="flex-1 justify-center items-center my-6">
                    {/* Centered Illustration */}
                    <View className="w-[260px] h-[260px] rounded-full items-center justify-center overflow-hidden relative mb-10">
                        <Image
                            source={require('../../assets/illustrations/catalog.png')}
                            style={{ width: 180, height: 180 }}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Descriptive Copy */}
                    <View className="items-center px-4">
                        <Typography
                            variant="h1"
                            weight="extrabold"
                            className="text-center text-gray-900 dark:text-white text-[28px] leading-8 font-black mb-3"
                        >
                            Your Public Showroom
                        </Typography>
                        <Typography
                            variant="body"
                            color="gray"
                            className="text-center leading-6 text-[15px] max-w-[320px]"
                        >
                            Bring your custom tailoring online. Showcase your unique design catalog, fabrics, and craft to a global audience with a beautiful storefront link.
                        </Typography>
                    </View>
                </View>

                {/* Footer Controls */}
                <View className="w-full items-center">
                    {/* Slide Indicators */}
                    <View className="flex-row gap-2 mb-8">
                        <View className="h-2 rounded-full w-6 bg-brand-primary" />
                        <View className="h-2 rounded-full w-2 bg-gray-200 dark:bg-zinc-800" />
                    </View>

                    {/* Next Button */}
                    <Button
                        onPress={() => router.push('/catalog-explainer/step2')}
                        className="w-full h-14 rounded-full bg-brand-primary border-0 shadow-none active:scale-98"
                        textClassName="text-white text-[16px] font-bold"
                    >
                        Next
                    </Button>
                </View>
            </View>
        </SafeAreaView>
    );
}
