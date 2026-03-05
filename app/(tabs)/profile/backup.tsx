import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CloudChange, TickCircle, Refresh, ShieldTick, Danger } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useSync } from '../../../hooks/useSync';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../contexts/ThemeContext';

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
                text1: 'Offline',
                text2: 'Please connect to the internet to ' + (full ? 'sync' : 'backup')
            });
            return;
        }

        try {
            await performSync({ full });
            Toast.show({
                type: 'success',
                text1: full ? 'Fresh Sync complete' : 'Backup complete',
                text2: full ? 'Your local records have been updated from the cloud' : 'Your data is now safe in the cloud'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: full ? 'Sync failed' : 'Backup failed',
                text2: 'Could not reach the server'
            });
        }
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <View className={`px-6 py-4 flex-row items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={20} color={isDark ? 'white' : 'black'} />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Backup Data</Typography>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-12" showsVerticalScrollIndicator={false}>
                <View className="items-center my-10">
                    <Surface variant={isDark ? "dark" : "blue"} className={`w-24 h-24 items-center justify-center mb-6 ${isDark ? 'border border-border-dark' : ''}`} rounded="3xl">
                        <CloudChange size={48} color={isDark ? "white" : "#3b82f6"} variant="Bulk" />
                    </Surface>
                    <Typography variant="h2" weight="bold" className="text-center mb-2">Cloud Backup</Typography>
                    <Typography variant="body" color="gray" className="text-center px-4">
                        Keep your workshop data safe and synchronized across all your devices.
                    </Typography>
                </View>

                <Surface variant="muted" className={`p-6 mb-8 border ${isDark ? 'border-border-dark' : 'border-gray-100'}`} rounded="3xl">
                    <View className="flex-row items-center justify-between mb-4">
                        <View>
                            <Typography variant="small" color="gray" weight="bold" className="uppercase tracking-wider">Status</Typography>
                            <Typography variant="body" weight="bold" className="mt-1">
                                {lastSyncError ? 'Sync Error' : (lastSyncedAt ? 'Everything is safe' : 'Not backed up yet')}
                            </Typography>
                        </View>
                        {lastSyncError ? (
                            <Danger size={24} color="#EF4444" variant="Bold" />
                        ) : (
                            <TickCircle size={24} color="#10B981" variant="Bold" />
                        )}
                    </View>
                    <View className={`h-[1px] mb-4 ${isDark ? 'bg-border-dark' : 'bg-gray-200'}`} />
                    <View>
                        <Typography variant="small" color="gray" weight="bold" className="uppercase tracking-wider">Last Backup</Typography>
                        <Typography variant="body" weight="semibold" className="mt-1">{formatDate(lastSyncedAt)}</Typography>
                    </View>
                </Surface>

                <View className="gap-4 mb-10">
                    <Surface variant="white" className={`p-4 border ${isDark ? 'border-border-dark' : 'border-gray-50'} flex-row items-center`} rounded="2xl" hasBorder>
                        <View className={`w-12 h-12 items-center justify-center rounded-xl mr-4 ${isDark ? 'bg-dark-800' : 'bg-blue-50'}`}>
                            <ShieldTick size={20} color="#3b82f6" variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography weight="bold">Secure Storage</Typography>
                            <Typography variant="small" color="gray">End-to-end encrypted backup</Typography>
                        </View>
                    </Surface>

                    <Surface variant="white" className={`p-4 border ${isDark ? 'border-border-dark' : 'border-gray-50'} flex-row items-center`} rounded="2xl" hasBorder>
                        <View className={`w-12 h-12 items-center justify-center rounded-xl mr-4 ${isDark ? 'bg-dark-800' : 'bg-blue-50'}`}>
                            <Refresh size={20} color="#3B82F6" variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography weight="bold">Auto Sync</Typography>
                            <Typography variant="small" color="gray">Syncs whenever you're online</Typography>
                        </View>
                    </Surface>
                </View>

                <Button
                    onPress={() => handleBackup(false)}
                    isLoading={isSyncing}
                    className="h-16 rounded-full bg-blue-600 border-0 shadow-lg"
                    textClassName="text-white"
                >
                    {isSyncing ? 'Backing up...' : 'Backup Now'}
                </Button>

                <Button
                    onPress={() => handleBackup(true)}
                    isLoading={isSyncing}
                    variant="ghost"
                    className="h-12 rounded-full mt-2"
                >
                    <View className="flex-row items-center">
                        <Refresh size={16} color={isDark ? '#9CA3AF' : '#6B7280'} className="mr-2" />
                        <Typography variant="small" color="gray">
                            Reset & Full Sync from Cloud
                        </Typography>
                    </View>
                </Button>
            </ScrollView>
        </View>
    );
}
