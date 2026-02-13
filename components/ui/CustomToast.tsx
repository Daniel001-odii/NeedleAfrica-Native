import React from 'react';
import { View } from 'react-native';
import { ToastConfig } from 'react-native-toast-message';
import { Typography } from './Typography';
import { TickCircle, CloseCircle, Danger, InfoCircle } from 'iconsax-react-native';

export const toastConfig: ToastConfig = {
    success: ({ text1, text2 }) => (
        <View style={{
            minHeight: 56,
            width: '90%',
            backgroundColor: '#F0FFF4',
            borderRadius: 100,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
            alignSelf: 'center',
            marginTop: 10,
            borderWidth: 1,
            borderColor: '#48BB78'
        }}>
            <TickCircle size={24} color="#48BB78" variant="Bold" />
            <View className="ml-3 flex-1">
                <Typography variant="body" weight="medium" color="black">
                    {text1}
                </Typography>
                {text2 && (
                    <Typography variant="small" color="gray" className="mt-0.5">
                        {text2}
                    </Typography>
                )}
            </View>
        </View>
    ),
    error: ({ text1, text2 }) => (
        <View style={{
            minHeight: 56,
            width: '90%',
            backgroundColor: '#FFF5F5',
            borderRadius: 100,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
            alignSelf: 'center',
            marginTop: 10,
            borderWidth: 1,
            borderColor: '#F56565'
        }}>
            <CloseCircle size={24} color="#F56565" variant="Bold" />
            <View className="ml-3 flex-1">
                <Typography variant="body" weight="medium" color="black" numberOfLines={1}>
                    {text1}
                </Typography>
                {text2 && (
                    <Typography variant="small" color="gray" className="mt-0.5">
                        {text2}
                    </Typography>
                )}
            </View>
        </View>
    ),
    info: ({ text1, text2 }) => (
        <View style={{
            minHeight: 56,
            width: '90%',
            backgroundColor: '#EBF8FF',
            borderRadius: 100,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
            alignSelf: 'center',
            marginTop: 10,
            borderWidth: 1,
            borderColor: '#4299E1'
        }}>
            <InfoCircle size={24} color="#4299E1" variant="Bold" />
            <View className="ml-3 flex-1">
                <Typography variant="body" weight="medium" color="black">
                    {text1}
                </Typography>
                {text2 && (
                    <Typography variant="small" color="gray" className="mt-0.5">
                        {text2}
                    </Typography>
                )}
            </View>
        </View>
    )
};
