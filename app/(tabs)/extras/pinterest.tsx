import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'iconsax-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/ui/Typography';

export default function StylesSearch() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-gray-50 rounded-full">
                    <ArrowLeft size={24} color="black" />
                </TouchableOpacity>
                <Typography variant="h3" weight="bold">Styles Search</Typography>
            </View>
            <WebView
                source={{ uri: 'https://www.pinterest.com/search/pins/?q=african%20fashion' }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </SafeAreaView>
    );
}
