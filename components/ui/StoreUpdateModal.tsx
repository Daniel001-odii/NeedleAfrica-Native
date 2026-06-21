import React, { useEffect, useState } from 'react';
import { Modal, View, Platform, Linking, Pressable } from 'react-native';
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
    const [dismissed, setDismissed] = useState(false);

    const currentVersion = Constants.expoConfig?.version || '1.0.0';

    useEffect(() => {
        checkVersion();
    }, []);

    const checkVersion = async () => {
        try {
            const response = await axiosInstance.get('/app-version');

            if (response.data.status === 'success' && response.data.data) {
                const serverVersion = response.data.data.version;
                const forceUpdate = response.data.data.forceUpdate;

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
            transparent={true}
            visible={needsUpdate && !dismissed}
            // visible={true}
            onRequestClose={() => setDismissed(true)}
            statusBarTranslucent={true}
        >
            <View className={`flex-1 ${isDark ? 'bg-black/70' : 'bg-black/40'} justify-end`}>
                <Pressable className={`mx-2 mb-12 rounded-3xl ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                    <View className="p-6 pb-12">
                        <View className="items-center mb-6 mt-2">
                            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                                <RefreshCircle size={32} color={isDark ? "#60A5FA" : "#3B82F6"} variant="Bulk" />
                            </View>
                            <Typography variant="h3" weight="bold" className="text-center mb-2">
                                A Fresh Update is Ready!
                            </Typography>
                            <View className={`px-4 py-1.5 rounded-full ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                                <Typography variant="small" weight="bold" className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                                    Version {updateInfo?.version || "1.5.0"}
                                </Typography>
                            </View>
                        </View>

                        <View className={`rounded-2xl p-4 mb-8 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'bg-surface-muted border-gray-100'}`}>
                            <Typography variant="body" className="text-center leading-6" color="gray">
                                {updateInfo?.updateMessage || "We've added new features, crushed some bugs, and made Needle Africa even faster. Update now to enjoy the best experience."}
                            </Typography>
                        </View>

                        <View className="space-y-3 flex flex-col gap-3">
                            <Button
                                onPress={handleUpdate}
                                style={{
                                    borderWidth: 0,
                                    shadowColor: 'transparent',
                                }}
                                className="h-14 rounded-full bg-blue-600 shadow-lg shadow-blue-500/30 border-none"
                                textClassName="text-white font-bold"
                            >
                                Update Now
                            </Button>

                            <Button
                                style={{
                                    borderWidth: 0,
                                    shadowColor: 'transparent',
                                }}
                                onPress={() => setDismissed(true)}
                                variant="outline"
                                className={`h-14 rounded-full ${isDark ? 'bg-gray-700 border-gray-700' : 'bg-gray-100 border-gray-100'}`}
                                textClassName={isDark ? "text-gray-300" : "text-gray-600"}
                            >
                                Remind Me Later
                            </Button>
                        </View>
                    </View>
                </Pressable>
            </View>
        </Modal>
    );
}