import React, { useEffect, useState } from 'react';
import { Modal, View, Platform, Linking, Image, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import { RefreshCircle, CloseCircle } from 'iconsax-react-native';
import Constants from 'expo-constants';
import axiosInstance from '../../lib/axios';

export function StoreUpdateModal() {
    const { isDark } = useTheme();
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<any>(null);
    const [dismissed, setDismissed] = useState(false);

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

    if (!needsUpdate || dismissed) return null;

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={needsUpdate && !dismissed}
            onRequestClose={() => { }}
            statusBarTranslucent={true}
        >
            <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-white'} justify-center items-center p-10`}>
                <View className="w-full max-w-sm items-center">
                    <View className="items-center">
                        {/* App Icon Container */}
                        <View className="mb-10 mt-4 shadow-xl shadow-black/30">
                            <View
                                className="w-32 h-32 rounded-[40px] overflow-hidden items-center justify-center p-0 bg-[#004236]"
                            >
                                <Image
                                    source={require('../../assets/app-icon.png')}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            </View>
                        </View>

                        <Typography variant="h2" weight="bold" className="text-center mb-2">
                            Please update to the latest version
                        </Typography>

                        <Typography variant="small" color="gray" weight="semibold" className="text-center mb-6">
                            {updateInfo?.version || "1.5.0"}
                        </Typography>

                        <Typography variant="body" color="gray" className="text-center leading-6 mb-10 px-2 opacity-80">
                            {updateInfo?.updateMessage || "New version available. We strongly recommend to install update before using the app. Latest release contains important improvements related to functionality."}
                        </Typography>

                        <View className="w-full space-y-4">
                            <Button
                                onPress={handleUpdate}
                                className="h-16 text-white rounded-full bg-blue-500 border-0 mb-3"
                                textClassName=" font-bold"
                            >
                                <Typography className='text-white'> Open {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}</Typography>

                            </Button>

                            <TouchableOpacity
                                onPress={() => setDismissed(true)}
                                className="h-12 items-center justify-center"
                            >
                                <Typography variant="body" weight="bold" className="text-blue-500">
                                    Not Now
                                </Typography>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
