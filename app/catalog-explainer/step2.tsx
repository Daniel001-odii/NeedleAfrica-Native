import React, { useState } from 'react';
import { View, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'iconsax-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

export default function CatalogStep2() {
    const router = useRouter();
    const { isDark } = useTheme();
    const [isSaving, setIsSaving] = useState(false);

    const handleCreateCatalog = async () => {
        setIsSaving(true);
        try {
            const { default: axiosInstance } = await import('../../lib/axios');
            const res = await axiosInstance.patch('/catalog', {
                catalogEnabled: false,
                catalogThemeColor: '#FF5678', // default brand primary
            });
            if (res.data && res.data.id) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Catalog created successfully' });
                // Go directly to the catalog management page!
                router.replace('/(tabs)/profile/catalog');
            }
        } catch (error: any) {
            console.error('Creation Failed:', error.response?.data || error);
            Toast.show({ type: 'error', text1: 'Creation Failed', text2: 'Could not create catalog' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <View className="flex-1 justify-between px-5 pb-8">
                {/* Header Back Button */}
                <View className="flex-row items-center justify-between h-12 w-full">
                    <TouchableOpacity
                        onPress={() => router.push('/catalog-explainer/step1')}
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
                            source={require('../../assets/illustrations/online.png')}
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
                            Accept Global Orders
                        </Typography>
                        <Typography
                            variant="body"
                            color="gray"
                            className="text-center leading-6 text-[15px] max-w-[320px]"
                        >
                            Let clients discover your work, contact you via WhatsApp, and request custom styling in real-time. Keep your business open 24/7.
                        </Typography>
                    </View>
                </View>

                {/* Footer Controls */}
                <View className="w-full items-center">
                    {/* Slide Indicators */}
                    <View className="flex-row gap-2 mb-8">
                        <View className="h-2 rounded-full w-2 bg-gray-200 dark:bg-zinc-800" />
                        <View className="h-2 rounded-full w-6 bg-brand-primary" />
                    </View>

                    {/* Create Catalog CTA Button */}
                    <Button
                        onPress={handleCreateCatalog}
                        isLoading={isSaving}
                        className="w-full h-14 rounded-full bg-brand-primary border-0 shadow-none active:scale-98"
                        textClassName="text-white text-[16px] font-bold"
                    >
                        Create My Catalog
                    </Button>
                </View>
            </View>
        </SafeAreaView>
    );
}
