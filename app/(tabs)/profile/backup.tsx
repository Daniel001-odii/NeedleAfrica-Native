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

export default function BackupData() {
    const router = useRouter();
    const { sync: performSync, isSyncing, lastSyncedAt, lastSyncError, isOnline } = useSync();

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

    const handleBackup = async () => {
        if (!isOnline) {
            Toast.show({
                type: 'error',
                text1: 'Offline',
                text2: 'Please connect to the internet to backup'
            });
            return;
        }

        try {
            await performSync();
            Toast.show({
                type: 'success',
                text1: 'Backup complete',
                text2: 'Your data is now safe in the cloud'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Backup failed',
                text2: 'Could not reach the server'
            });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Backup Data</Typography>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-12" showsVerticalScrollIndicator={false}>
                <View className="items-center my-10">
                    <Surface variant="lavender" className="w-24 h-24 items-center justify-center mb-6" rounded="3xl">
                        <CloudChange size={48} color="#1C1C1E" variant="Bulk" />
                    </Surface>
                    <Typography variant="h2" weight="bold" className="text-center mb-2">Cloud Backup</Typography>
                    <Typography variant="body" color="gray" className="text-center px-4">
                        Keep your workshop data safe and synchronized across all your devices.
                    </Typography>
                </View>

                <Surface variant="muted" className="p-6 mb-8 border border-gray-50" rounded="3xl">
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
                    <View className="h-[1px] bg-gray-200 mb-4" />
                    <View>
                        <Typography variant="small" color="gray" weight="bold" className="uppercase tracking-wider">Last Backup</Typography>
                        <Typography variant="body" weight="semibold" className="mt-1">{formatDate(lastSyncedAt)}</Typography>
                    </View>
                </Surface>

                <View className="gap-4 mb-10">
                    <Surface variant="white" className="p-4 border border-gray-50 flex-row items-center" rounded="2xl" hasBorder>
                        <View className="w-12 h-12 items-center justify-center bg-green-50 rounded-xl mr-4">
                            <ShieldTick size={20} color="#10B981" variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography weight="bold">Secure Storage</Typography>
                            <Typography variant="small" color="gray">End-to-end encrypted backup</Typography>
                        </View>
                    </Surface>

                    <Surface variant="white" className="p-4 border border-gray-50 flex-row items-center" rounded="2xl" hasBorder>
                        <View className="w-12 h-12 items-center justify-center bg-blue-50 rounded-xl mr-4">
                            <Refresh size={20} color="#3B82F6" variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography weight="bold">Auto Sync</Typography>
                            <Typography variant="small" color="gray">Syncs whenever you're online</Typography>
                        </View>
                    </Surface>
                </View>

                <Button
                    onPress={handleBackup}
                    isLoading={isSyncing}
                    className="h-16 rounded-full bg-dark border-0 shadow-lg"
                    textClassName="text-white"
                >
                    {isSyncing ? 'Backing up...' : 'Backup Now'}
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
}
