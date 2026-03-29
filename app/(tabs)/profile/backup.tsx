import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft, CloudChange, TickCircle, Refresh,
    ShieldTick, Danger, InfoCircle, Cloud
} from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useSync } from '../../../hooks/useSync';
import { useTheme } from '../../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

export default function BackupData() {
    const router = useRouter();
    const { sync: performSync, isSyncing, lastSyncedAt, lastSyncError, isOnline } = useSync();
    const { isDark } = useTheme();

    const formatDate = (timestamp: number | null) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleBackup = async (full = false) => {
        if (!isOnline) {
            Toast.show({
                type: 'error',
                text1: 'Connection Error',
                text2: 'Please connect to the internet to sync data.'
            });
            return;
        }

        try {
            await performSync({ full });
            Toast.show({
                type: 'success',
                text1: full ? 'Database Reset & Synced' : 'Backup Successful',
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Sync Failed',
                text2: 'Please try again later'
            });
        }
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            {/* Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-zinc-950 border-b border-white/5' : 'bg-white border-b border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                    />
                    <Typography variant="h3" weight="bold" className="ml-2">Backup & Sync</Typography>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-5 pb-12" keyboardShouldPersistTaps="handled">

                {/* Visual Status Hero */}
                <View className="items-center py-8">
                    <View className={`w-20 h-20 rounded-[28px] items-center justify-center mb-4 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-blue-50'}`}>
                        {isSyncing ? (
                            <ActivityIndicator color="#3b82f6" />
                        ) : (
                            <CloudChange size={40} color="#3b82f6" variant="Bulk" />
                        )}
                    </View>
                    <Typography variant="h2" weight="bold">Cloud Backup</Typography>
                    <Typography color="gray" className="text-center px-10 mt-2">
                        Your workshop data is securely encrypted and synced across your devices.
                    </Typography>
                </View>

                {/* Status Group */}
                <SectionLabel label="Sync Status" isFirst />
                <View className={`rounded-2xl overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white shadow-sm shadow-gray-200'}`}>
                    <InfoRow
                        label="Database Status"
                        value={lastSyncError ? 'Attention Required' : 'Up to date'}
                        valueColor={lastSyncError ? 'text-red-500' : 'text-green-600'}
                        icon={lastSyncError ? <Danger size={20} color="#EF4444" variant="Bold" /> : <TickCircle size={20} color="#10B981" variant="Bold" />}
                    />
                    <InfoRow
                        label="Last Cloud Sync"
                        value={formatDate(lastSyncedAt)}
                        last
                    />
                </View>

                {/* Features Info Group */}
                <SectionLabel label="Security & Logic" />
                <View className={`rounded-2xl overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white shadow-sm shadow-gray-200'}`}>
                    <SettingItem
                        icon={<ShieldTick size={20} color="#3b82f6" variant="Bulk" />}
                        title="End-to-End Encryption"
                        subtitle="Only you can access your data"
                    />
                    <SettingItem
                        icon={<Refresh size={20} color="#3b82f6" variant="Bulk" />}
                        title="Automatic Background Sync"
                        subtitle="Syncs when connected to Wi-Fi"
                        last
                    />
                </View>

                {/* Action Buttons */}
                <View className="mt-10">
                    <Button
                        onPress={() => handleBackup(false)}
                        isLoading={isSyncing}
                        className="h-16 rounded-full bg-blue-600 border-0"
                        textClassName="text-white font-bold text-lg"
                    >
                        Backup Now
                    </Button>

                    <TouchableOpacity
                        onPress={() => handleBackup(true)}
                        disabled={isSyncing}
                        className="mt-4 flex-row items-center justify-center py-2"
                    >
                        <Refresh size={14} color={isDark ? '#71717a' : '#9CA3AF'} />
                        <Typography variant="small" color="gray" className="ml-2 font-medium">
                            Force Full Cloud Sync
                        </Typography>
                    </TouchableOpacity>
                </View>

                {/* Online Indicator */}
                <View className="items-center mt-6">
                    <View className="flex-row items-center px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
                        <View className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                        <Typography variant="caption" color="gray">
                            {isOnline ? 'System Online' : 'Offline Mode'}
                        </Typography>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

/** 
 * Reusable Internal Components
 */

function SectionLabel({ label, isFirst }: { label: string, isFirst?: boolean }) {
    return (
        <Typography variant="caption" color="gray" weight="bold" className={`${isFirst ? 'mt-2' : 'mt-8'} mb-2 ml-4 uppercase tracking-widest text-[11px]`}>
            {label}
        </Typography>
    );
}

function InfoRow({ label, value, valueColor = '', icon, last }: { label: string, value: string, valueColor?: string, icon?: React.ReactNode, last?: boolean }) {
    const { isDark } = useTheme();
    return (
        <View className="px-4 h-16 flex-row items-center justify-between">
            <Typography variant="body" color="gray" weight="medium">{label}</Typography>
            <View className="flex-row items-center">
                <Typography weight="bold" className={`mr-2 ${valueColor || (isDark ? 'text-white' : 'text-zinc-950')}`}>
                    {value}
                </Typography>
                {icon}
            </View>
            {!last && <View className={`absolute bottom-0 right-0 left-4 h-[1px] ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`} />}
        </View>
    );
}

function SettingItem({ icon, title, subtitle, last }: { icon: React.ReactNode, title: string, subtitle: string, last?: boolean }) {
    const { isDark } = useTheme();
    return (
        <View className="px-4 py-4 flex-row items-center">
            <View className={`w-10 h-10 items-center justify-center rounded-xl mr-4 ${isDark ? 'bg-zinc-800' : 'bg-blue-50'}`}>
                {icon}
            </View>
            <View className="flex-1">
                <Typography weight="bold">{title}</Typography>
                <Typography variant="small" color="gray">{subtitle}</Typography>
            </View>
            {!last && <View className={`absolute bottom-0 right-0 left-16 h-[1px] ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`} />}
        </View>
    );
}