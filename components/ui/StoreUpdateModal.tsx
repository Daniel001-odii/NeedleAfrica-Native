import React, { useEffect, useState } from 'react';
import { Modal, View, Platform, Linking } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import { RefreshCircle } from 'iconsax-react-native';
import Constants from 'expo-constants';
import axiosInstance from '../../lib/axios';

export function StoreUpdateModal() {
    const { isDark } = useTheme();
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<any>(null);

    const currentVersion = Constants.expoConfig?.version || '1.0.0';

    useEffect(() => {
        checkVersion();
    }, []);

    const checkVersion = async () => {
        try {
            // Fetch the required version from the API
            const response = await axiosInstance.get('/app-version');
            
            if (response.data.status === 'success' && response.data.data) {
                const serverVersion = response.data.data.version;
                const forceUpdate = response.data.data.forceUpdate;
                
                // Simple version comparison: if not the same and forceUpdate is enabled
                // In production, you might want to use something like 'compare-versions' 
                // but this satisfies the user's specific "is not the same" requirement.
                if (serverVersion !== currentVersion && forceUpdate) {
                    setNeedsUpdate(true);
                    setUpdateInfo(response.data.data);
                }
            }
        } catch (error) {
            console.error('Check app version error:', error);
        }
    };

    const handleUpdate = () => {
        const url = Platform.OS === 'ios' ? updateInfo?.iosUrl : updateInfo?.androidUrl;
        const fallbackUrl = Platform.OS === 'ios' 
            ? 'https://apps.apple.com/app/needlex/id6470000000' 
            : 'https://play.google.com/store/apps/details?id=com.needleafrica.app';
            
        Linking.openURL(url || fallbackUrl);
    };

    if (!needsUpdate) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={needsUpdate}
            // Force update: cannot be dismissed by back button on Android
            onRequestClose={() => {}}
        >
            <View className={`flex-1 bg-black/60 justify-end`}>
                <View className={`m-2 mb-12 rounded-3xl ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                    <View className="p-6 pb-12">
                        <View className="items-center mb-6 mt-4">
                            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
                                <RefreshCircle size={32} color={isDark ? "#F87171" : "#EF4444"} variant="Bulk" />
                            </View>
                            <Typography variant="h3" weight="bold" className="text-center">Mandatory Update</Typography>
                        </View>

                        <View className={`rounded-2xl p-4 mb-8 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'bg-surface-muted border-gray-100'}`}>
                            <Typography variant="body" className="text-center leading-6" color="gray">
                                {updateInfo?.updateMessage || "A critical update is available for NeedleX. Please update to the latest version to continue using the app."}
                            </Typography>
                        </View>

                        <View className="space-y-4">
                            <Button
                                onPress={handleUpdate}
                                className="h-14 rounded-full bg-red-600 mb-3"
                                textClassName="text-white font-bold"
                            >
                                Update from Store
                            </Button>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
