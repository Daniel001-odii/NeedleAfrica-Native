import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'iconsax-react-native';
import { WebView } from 'react-native-webview';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { useTheme } from '../../../contexts/ThemeContext';

export default function ClothIdeas() {
    const router = useRouter();
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(true);

    // Predefined search keyword for Pinterest
    const searchKeyword = encodeURIComponent('African fashion styles');
    const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${searchKeyword}`;

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <View className={`px-6 py-4 flex-row items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Style Ideas</Typography>
            </View>

            <View className="flex-1">
                <WebView
                    source={{ uri: pinterestUrl }}
                    style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View className="absolute inset-0 items-center justify-center bg-transparent">
                            <ActivityIndicator size="large" color="#F43F5E" />
                        </View>
                    )}
                />
                {loading && (
                    <View className="absolute inset-0 items-center justify-center">
                        <ActivityIndicator size="large" color="#F43F5E" />
                    </View>
                )}
            </View>
        </View>
    );
}

