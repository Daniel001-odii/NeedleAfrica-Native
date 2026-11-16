import React, { useEffect, useState } from 'react';
import { Modal, View, Platform, Linking, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography } from './Typography';
import { Button } from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import { RefreshCircle } from 'iconsax-react-native';
import Constants from 'expo-constants';
import axiosInstance from '../../lib/axios';
import { isNewerVersion } from '../../utils/version';

const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const SNOOZE_STORAGE_PREFIX = '@needlex_update_snooze_';

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
                const forceUpdate = response.data.data.forceUpdate === true;

                if (isNewerVersion(serverVersion, currentVersion)) {
                    // Mandatory update: bypass any snooze and enforce immediately
                    if (forceUpdate) {
                        setUpdateInfo(response.data.data);
                        setNeedsUpdate(true);
                        return;
                    }

                    // Optional update: check if snoozed within the last 24 hours
                    const snoozeKey = `${SNOOZE_STORAGE_PREFIX}${serverVersion}`;
                    const snoozedAtStr = await AsyncStorage.getItem(snoozeKey);
                    if (snoozedAtStr) {
                        const snoozedAt = parseInt(snoozedAtStr, 10);
                        if (!isNaN(snoozedAt) && Date.now() - snoozedAt < SNOOZE_DURATION_MS) {
                            return; // Suppressed by 24h snooze
                        }
                    }

                    setUpdateInfo(response.data.data);
                    setNeedsUpdate(true);
                }
            }
        } catch (error) {
            console.error('Check app version error:', error);
        }
    };

    const handleUpdate = () => {
        const url = Platform.OS === 'ios' ? updateInfo?.iosUrl : updateInfo?.androidUrl;
        const fallbackUrl = Platform.OS === 'ios'
            ? 'https://apps.apple.com/us/app/needlex-fashion-designer-kit/id6759835205'
            : 'https://play.google.com/store/apps/details?id=com.needleafrica.app';

        Linking.openURL(url || fallbackUrl);
    };

    const handleRemindLater = async () => {
        try {
            if (updateInfo?.version) {
                const snoozeKey = `${SNOOZE_STORAGE_PREFIX}${updateInfo.version}`;
                await AsyncStorage.setItem(snoozeKey, Date.now().toString());
            }
        } catch (err) {
            console.error('Error saving snooze timestamp:', err);
        } finally {
            setDismissed(true);
        }
    };

    const isMandatory = updateInfo?.forceUpdate === true;

    if (!needsUpdate || (!isMandatory && dismissed)) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={needsUpdate && (isMandatory || !dismissed)}
            onRequestClose={isMandatory ? () => {} : handleRemindLater}
            statusBarTranslucent={true}
        >
            <View className={`flex-1 ${isDark ? 'bg-black/70' : 'bg-black/40'} justify-end`}>
                <Pressable
                    onPress={(e) => e.stopPropagation()}
                    className={`mx-2 mb-12 rounded-3xl ${isDark ? 'bg-background-dark' : 'bg-white'}`}
                >
                    <View className="p-6 pb-12">
                        <View className="items-center mb-6 mt-2">
                            <View
                                className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                                    isMandatory
                                        ? isDark ? 'bg-red-500/20' : 'bg-red-50'
                                        : isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                                }`}
                            >
                                <RefreshCircle
                                    size={32}
                                    color={
                                        isMandatory
                                            ? isDark ? "#F87171" : "#EF4444"
                                            : isDark ? "#60A5FA" : "#3B82F6"
                                    }
                                    variant="Bulk"
                                />
                            </View>
                            <Typography variant="h3" weight="bold" className="text-center mb-2">
                                {isMandatory ? 'Critical Update Required' : 'A Fresh Update is Ready!'}
                            </Typography>
                            <View
                                className={`px-4 py-1.5 rounded-full ${
                                    isMandatory
                                        ? isDark ? 'bg-red-500/10' : 'bg-red-50'
                                        : isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                                }`}
                            >
                                <Typography
                                    variant="small"
                                    weight="bold"
                                    className={
                                        isMandatory
                                            ? isDark ? 'text-red-400' : 'text-red-600'
                                            : isDark ? 'text-blue-400' : 'text-blue-600'
                                    }
                                >
                                    Version {updateInfo?.version || "1.5.0"} {isMandatory ? '• Mandatory' : ''}
                                </Typography>
                            </View>
                        </View>

                        <View className={`rounded-2xl p-4 mb-8 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'bg-surface-muted border-gray-100'}`}>
                            <Typography variant="body" className="text-center leading-6" color="gray">
                                {updateInfo?.updateMessage ||
                                    (isMandatory
                                        ? "This update includes vital security and system improvements required to keep using NeedleX. Please update now to continue."
                                        : "We've added new features, crushed some bugs, and made Needle Africa even faster. Update now to enjoy the best experience.")
                                }
                            </Typography>
                        </View>

                        <View className="space-y-3 flex flex-col gap-3">
                            <Button
                                onPress={handleUpdate}
                                style={{
                                    borderWidth: 0,
                                    shadowColor: 'transparent',
                                }}
                                className={`h-14 rounded-full ${
                                    isMandatory ? 'bg-red-600 shadow-red-500/30' : 'bg-blue-600 shadow-blue-500/30'
                                } shadow-lg border-none`}
                                textClassName="text-white font-bold"
                            >
                                Update Now
                            </Button>

                            {!isMandatory && (
                                <Button
                                    style={{
                                        borderWidth: 0,
                                        shadowColor: 'transparent',
                                    }}
                                    onPress={handleRemindLater}
                                    variant="outline"
                                    className={`h-14 rounded-full ${isDark ? 'bg-gray-700 border-gray-700' : 'bg-gray-100 border-gray-100'}`}
                                    textClassName={isDark ? "text-gray-300" : "text-gray-600"}
                                >
                                    Remind Me Later
                                </Button>
                            )}
                        </View>
                    </View>
                </Pressable>
            </View>
        </Modal>
    );
}
