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
            animationType="fade"
            transparent={true}
            visible={needsUpdate && !dismissed}
            onRequestClose={() => { }}
            statusBarTranslucent={true}
        >
            <View className={`flex-1 ${isDark ? 'bg-black/80' : 'bg-black/40'} justify-center p-6`}>
                <View className={`w-full p-8 rounded-[40px] ${isDark ? 'bg-[#1C1C1E] border border-white/10' : 'bg-white'} items-center shadow-2xl`}>
                    
                    {/* App Icon Container */}
                    <View className="mb-8 mt-2 items-center justify-center relative">
                        <View className={`p-4 rounded-[48px] ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <View className={`w-24 h-24 rounded-[32px] overflow-hidden items-center justify-center shadow-sm`}>
                                <Image
                                    source={require('../../assets/app-icon.png')}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            </View>
                        </View>
                        
                        {/* Update Notification Badge */}
                        <View className="absolute top-2 right-2 bg-blue-600 w-8 h-8 rounded-full border-[3px] border-white dark:border-[#1C1C1E] items-center justify-center">
                            <Typography weight="black" color="white" className="text-[12px] mt-[-1px] font-black">1</Typography>
                        </View>
                    </View>

                    <Typography variant="h1" weight="bold" className="text-center mb-4 text-3xl">
                        A Fresh Update{'\n'}is Ready!
                    </Typography>

                    <View className={`px-4 py-1.5 rounded-full mb-5 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                        <Typography variant="small" weight="bold" className="text-blue-600 dark:text-blue-400">
                            Version {updateInfo?.version || "1.5.0"}
                        </Typography>
                    </View>

                    <Typography variant="body" color="gray" className="text-center leading-relaxed mb-8 text-[15px] px-2">
                        {updateInfo?.updateMessage || "We've added new features, crushed some bugs, and made Needle Africa even faster. Update now to enjoy the best experience."}
                    </Typography>

                    <View className="w-full space-y-3">
                        <Button
                            onPress={handleUpdate}
                            className="w-full h-[56px] rounded-full bg-blue-600 border-0 flex-row items-center justify-center shadow-lg shadow-blue-500/30"
                        >
                            <View className="flex-row items-center">
                                <RefreshCircle size={22} color="white" variant="Bulk" className="mr-2" />
                                <Typography className="text-white font-bold text-[16px]">Update Now</Typography>
                            </View>
                        </Button>

                        <TouchableOpacity
                            onPress={() => setDismissed(true)}
                            className="h-[48px] items-center justify-center"
                        >
                            <Typography variant="body" weight="bold" className="text-gray-400 text-[15px]">
                                Remind Me Later
                            </Typography>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}
