import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, DocumentDownload, InfoCircle, ArchiveBook, Personalcard } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import axiosInstance from '../../../lib/axios';
import Toast from 'react-native-toast-message';

export default function DownloadData() {
    const router = useRouter();
    const [isRequesting, setIsRequesting] = useState(false);

    const handleRequestDownload = async () => {
        setIsRequesting(true);
        try {
            const response = await axiosInstance.post('/users/download-data');

            Alert.alert(
                "Request Successful",
                response.data.message || "Your data request has been received. We will send a download link to your registered email address when it's ready.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to request data';
            Toast.show({
                type: 'error',
                text1: 'Request Failed',
                text2: errorMsg
            });
        } finally {
            setIsRequesting(false);
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
                <Typography variant="h3" weight="bold" className="ml-2">Download Your Data</Typography>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-12" showsVerticalScrollIndicator={false}>
                <View className="items-center my-10">
                    <Surface variant="peach" className="w-24 h-24 items-center justify-center mb-6" rounded="3xl">
                        <DocumentDownload size={48} color="#10b981" variant="Bulk" />
                    </Surface>
                    <Typography variant="h2" weight="bold" className="text-center mb-2">Your Information</Typography>
                    <Typography variant="body" color="gray" className="text-center px-4">
                        Download a copy of your personal data, customer records, and order history.
                    </Typography>
                </View>

                <Surface variant="muted" className="p-6 mb-8 border border-gray-100" rounded="3xl">
                    <View className="flex-row items-start mb-1">
                        <InfoCircle size={20} color="#F59E0B" variant="Bulk" className="mt-1" />
                        <View className="flex-1 ml-3">
                            <Typography weight="bold" className="mb-1">What's included?</Typography>
                            <Typography variant="small" color="gray" className="leading-5">
                                Your download will include a JSON/CSV file containing your profile info, customer list, measurement records, and order history for your workshop.
                            </Typography>
                        </View>
                    </View>
                </Surface>

                <View className="gap-4 mb-12">
                    <Surface variant="white" className="p-4 border border-gray-50 flex-row items-center" rounded="2xl" hasBorder>
                        <View className="w-12 h-12 items-center justify-center bg-purple-50 rounded-xl mr-4">
                            <Personalcard size={20} color="#8B5CF6" variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography weight="bold">Personal Info</Typography>
                            <Typography variant="small" color="gray">Profile, settings & preferences</Typography>
                        </View>
                    </Surface>

                    <Surface variant="white" className="p-4 border border-gray-50 flex-row items-center" rounded="2xl" hasBorder>
                        <View className="w-12 h-12 items-center justify-center bg-orange-50 rounded-xl mr-4">
                            <ArchiveBook size={20} color="#FB923C" variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography weight="bold">Workshop Data</Typography>
                            <Typography variant="small" color="gray">All orders, customers & measurements</Typography>
                        </View>
                    </Surface>
                </View>

                <Button
                    onPress={handleRequestDownload}
                    isLoading={isRequesting}
                    className="h-16 rounded-full bg-dark border-0 shadow-lg"
                    textClassName="text-white"
                >
                    Request Download
                </Button>

                <Typography variant="small" color="gray" className="text-center mt-6 px-8 leading-tight">
                    For security reasons, this link will only be valid for 24 hours after it's generated.
                </Typography>
            </ScrollView>
        </SafeAreaView>
    );
}
