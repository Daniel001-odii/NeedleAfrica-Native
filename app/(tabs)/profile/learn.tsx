import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Refresh2 } from 'iconsax-react-native';
import { WebView } from 'react-native-webview';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { useTheme } from '../../../contexts/ThemeContext';

export default function LearnScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const [webViewLoading, setWebViewLoading] = useState(true);
    const [webViewKey, setWebViewKey] = useState(0);

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`} edges={[]}>
            {/* Header */}
            <View className={`px-4 py-3 flex-row items-center justify-between border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                    />
                    <Typography variant="h3" weight="bold" className="ml-1">Learn</Typography>
                </View>
            </View>

            {/* WebView */}
            <View className="flex-1 relative">
                <WebView
                    key={webViewKey}
                    source={{ uri: 'https://needleafrica.com/learn?source=app' }}
                    style={{ flex: 1, backgroundColor: isDark ? '#09090b' : '#ffffff' }}
                    onLoadStart={() => setWebViewLoading(true)}
                    onLoadEnd={() => setWebViewLoading(false)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    originWhitelist={['*']}
                />
                {webViewLoading && (
                    <View className="absolute inset-0 items-center justify-center bg-white/50 dark:bg-black/50">
                        <ActivityIndicator size="large" color="#2563EB" />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
