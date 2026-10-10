import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Messages1, SearchNormal1, Share, DirectSend } from 'iconsax-react-native';
import { router } from 'expo-router';
import { Typography } from '../components/ui/Typography';
import { IconButton } from '../components/ui/IconButton';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCatalog } from '../hooks/useCatalog';

export default function ChatsScreen() {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const { catalog } = useCatalog();

    const catalogUrl = catalog?.id
        ? `https://catalog.needleafrica.com/cg/${catalog.id}`
        : '';

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3">
                <View className="flex-row items-center flex-1">
                    <IconButton
                        icon={<ArrowLeft size={24} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                        className="-ml-2"
                    />
                    <Typography
                        variant="h3"
                        weight="bold"
                        className={`ml-2 ${isDark ? 'text-white' : 'text-black'}`}
                    >
                        Chats
                    </Typography>
                </View>

                <View className="flex-row items-center gap-1">
                    <IconButton
                        icon={<SearchNormal1 size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />}
                        onPress={() => { }}
                        variant="ghost"
                    />
                </View>
            </View>

            {/* Main Content: Empty State */}
            <ScrollView
                contentContainerClassName="flex-1 items-center justify-center px-8 pb-12"
                showsVerticalScrollIndicator={false}
            >
                {/* Icon Badge */}
                <View
                    className="w-24 h-24 rounded-full items-center justify-center mb-6"
                    style={{
                        backgroundColor: isDark ? 'rgba(255, 86, 120, 0.12)' : 'rgba(255, 86, 120, 0.08)',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 86, 120, 0.25)' : 'rgba(255, 86, 120, 0.15)',
                    }}
                >
                    <Messages1 size={48} color="#FF5678" variant="Bold" />
                </View>

                {/* Headline & Description */}
                <Typography
                    variant="h3"
                    weight="bold"
                    className={`text-center text-xl mb-3 ${isDark ? 'text-white' : 'text-neutral-900'}`}
                >
                    No conversations yet
                </Typography>

                <Typography
                    variant="body"
                    color="gray"
                    className="text-center text-sm leading-6 max-w-xs mb-8"
                >
                    Direct inquiries and customer messages from your digital catalog and the NeedleX marketplace will appear here in real time.
                </Typography>
            </ScrollView>
        </View>
    );
}
