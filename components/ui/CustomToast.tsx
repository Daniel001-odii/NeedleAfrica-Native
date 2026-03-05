import React from 'react';
import { View } from 'react-native';
import { ToastConfig } from 'react-native-toast-message';
import { Typography } from './Typography';
import { TickCircle, CloseCircle, InfoCircle } from 'iconsax-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface BaseToastProps {
    text1?: string;
    text2?: string;
    icon: any;
    color: string;
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
}

const BaseToast = ({ text1, text2, icon: Icon, color, bgLight, bgDark, borderLight, borderDark }: BaseToastProps) => {
    const { isDark } = useTheme();

    return (
        <View style={{
            minHeight: 56,
            width: '90%',
            backgroundColor: isDark ? bgDark : bgLight,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.05,
            shadowRadius: 10,
            elevation: 2,
            alignSelf: 'center',
            marginTop: 10,
            borderWidth: 1,
            borderColor: isDark ? borderDark : borderLight
        }}>
            <Icon size={24} color={color} variant="Bold" />
            <View className="ml-3 flex-1">
                <Typography variant="body" weight="medium" color="black" numberOfLines={2}>
                    {text1}
                </Typography>
                {!!text2 && (
                    <Typography variant="small" color="gray" className="mt-0.5">
                        {text2}
                    </Typography>
                )}
            </View>
        </View>
    );
};

export const toastConfig: ToastConfig = {
    success: (props) => (
        <BaseToast
            text1={props.text1}
            text2={props.text2}
            icon={TickCircle}
            color="#48BB78"
            bgLight="#F0FFF4"
            bgDark="#1A2F22"
            borderLight="#48BB78"
            borderDark="#276749"
        />
    ),
    error: (props) => (
        <BaseToast
            text1={props.text1}
            text2={props.text2}
            icon={CloseCircle}
            color="#F56565"
            bgLight="#FFF5F5"
            bgDark="#3C1A1A"
            borderLight="#F56565"
            borderDark="#9B2C2C"
        />
    ),
    info: (props) => (
        <BaseToast
            text1={props.text1}
            text2={props.text2}
            icon={InfoCircle}
            color="#4299E1"
            bgLight="#EBF8FF"
            bgDark="#1A273A"
            borderLight="#4299E1"
            borderDark="#2B6CB0"
        />
    )
};
