import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { Surface } from './Surface';
import { Typography } from './Typography';
import { Button } from './Button';
import { CloseCircle, Danger, InfoCircle } from 'iconsax-react-native';

interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning';
}

export function ConfirmModal({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info'
}: ConfirmModalProps) {
    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <Danger size={32} color="#EF4444" variant="Bulk" />;
            case 'warning': return <Danger size={32} color="#F59E0B" variant="Bulk" />;
            default: return <InfoCircle size={32} color="#3B82F6" variant="Bulk" />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'danger': return 'text-red-500';
            case 'warning': return 'text-amber-500';
            default: return 'text-blue-500';
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onCancel}
                className="flex-1 bg-black/50 justify-center items-center px-6"
            >
                <TouchableOpacity activeOpacity={1} className="w-full">
                    <Surface variant="white" className="p-6 overflow-hidden" rounded="3xl">
                        <View className="items-center mb-4">
                            {getIcon()}
                        </View>

                        <Typography variant="h3" weight="bold" className={`text-center mb-2 ${getHeaderColor()}`}>
                            {title}
                        </Typography>

                        <Typography variant="body" color="gray" className="text-center mb-8 px-2 leading-6">
                            {message}
                        </Typography>

                        <View className="flex-row gap-3">
                            <Button
                                onPress={onCancel}
                                variant="secondary"
                                className="flex-1 h-12 bg-gray-50 border-0 rounded-2xl"
                                textClassName="text-gray-500 font-bold"
                            >
                                {cancelText}
                            </Button>
                            <Button
                                onPress={() => {
                                    onConfirm();
                                    onCancel();
                                }}
                                className={`flex-1 h-12 rounded-2xl ${type === 'danger' ? 'bg-red-500' : 'bg-dark'}`}
                                textClassName="text-white font-bold"
                            >
                                {confirmText}
                            </Button>
                        </View>
                    </Surface>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}
