import React, { useEffect, useState } from 'react';
import { Modal, View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import * as Updates from 'expo-updates';
import { Typography } from './Typography';
import { Button } from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import { RefreshCircle } from 'iconsax-react-native';

interface OTAUpdateModalProps {
    /** 
     * If true, forces the modal to appear for UI testing purposes 
     */
    testMode?: boolean;
}

export function OTAUpdateModal({ testMode = false }: OTAUpdateModalProps) {
    const { isDark } = useTheme();
    const [isUpdateReady, setIsUpdateReady] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        // If test mode is on, show the modal after a short delay so the user can see it
        // and bypass the actual Expo Updates API check (which behaves differently in dev mode)
        if (testMode) {
            const timer = setTimeout(() => {
                setIsUpdateReady(true);
            }, 3000); // 3 second delay to simulate checking/downloading on start up
            return () => clearTimeout(timer);
        }

        // Only run real OTA checks in production/preview builds
        if (!__DEV__) {
            checkForUpdate();
        }
    }, [testMode]);

    async function checkForUpdate() {
        try {
            setIsChecking(true);
            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
                setIsDownloading(true);
                await Updates.fetchUpdateAsync();
                setIsUpdateReady(true);
            }
        } catch (error) {
            console.log(`Error fetching latest Expo update: ${error}`);
        } finally {
            setIsChecking(false);
            setIsDownloading(false);
        }
    }

    const handleApplyUpdate = async () => {
        if (testMode) {
            setIsUpdateReady(false); // Just dismiss in test mode
            return;
        }

        await Updates.reloadAsync();
    };

    const handleDismissLater = () => {
        setIsUpdateReady(false);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isUpdateReady}
            onRequestClose={handleDismissLater}
        >
            <View className={`flex-1 bg-black/60 justify-end`}>
                <Pressable className={`m-2 mb-12 rounded-3xl ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                    <View className="p-6 pb-12">
                        <View className="items-center mb-6 mt-4">
                            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                                <RefreshCircle size={32} color={isDark ? "#60A5FA" : "#3B82F6"} variant="Bulk" />
                            </View>
                            <Typography variant="h3" weight="bold" className="text-center">Update Available</Typography>
                        </View>

                        <View className={`rounded-2xl p-4 mb-8 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'bg-surface-muted border-gray-100'}`}>
                            <Typography variant="body" className="text-center leading-6" color="gray">
                                We've just released a new update with improvements and bug fixes.
                                Please update now to ensure you have the best experience.
                            </Typography>
                        </View>

                        <View className="space-y-4">
                            <Button
                                onPress={handleApplyUpdate}
                                className="h-14 rounded-full bg-blue-600 mb-3"
                                textClassName="text-white"
                            >
                                {testMode ? "Apply Update (Test)" : "Update Now"}
                            </Button>

                            <Button
                                onPress={handleDismissLater}
                                variant="outline"
                                className={`h-14 rounded-full ${isDark ? 'bg-transparent border-gray-700' : 'bg-transparent border-gray-200'}`}
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

