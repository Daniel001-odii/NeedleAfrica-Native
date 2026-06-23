import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Refresh2 } from 'iconsax-react-native';
import { WebView } from 'react-native-webview';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function MonogramScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [webViewLoading, setWebViewLoading] = useState(true);
    const [webViewKey, setWebViewKey] = useState(0);

    // Build the monogram URL with the user's name
    const userName = user?.username || user?.businessName || 'Guest';
    const encodedName = encodeURIComponent(userName);
    const webViewUrl = `https://www.needleafrica.com/design?name=${encodedName}`;

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`} edges={['top']}>
            {/* Header */}
            <View className={`px-4 py-3 flex-row items-center justify-between border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                    />
                    <Typography variant="h3" weight="bold" className="ml-1">Monogram</Typography>
                </View>
                {/* <IconButton
                    icon={<Refresh2 size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />}
                    onPress={() => {
                        setWebViewLoading(true);
                        setWebViewKey(prev => prev + 1);
                    }}
                    variant="ghost"
                /> */}
            </View>

            {/* WebView */}
            <View className="flex-1 relative">
                <WebView
                    key={webViewKey}
                    source={{ uri: webViewUrl }}
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
