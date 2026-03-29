import React from 'react';
import { View, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { TickCircle } from 'iconsax-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ActionSheetOption<T> {
    key: T;
    label: string;
}

interface ActionSheetProps<T> {
    visible: boolean;
    onClose: () => void;
    title?: string;
    options: ActionSheetOption<T>[];
    selectedValue: T;
    onSelect: (value: T) => void;
}

export function ActionSheet<T extends string>({
    visible,
    onClose,
    title,
    options,
    selectedValue,
    onSelect,
}: ActionSheetProps<T>) {
    const { isDark } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/40">
                <Pressable className="flex-1" onPress={onClose} />
                
                <View className="px-4 pb-10">
                    <View className={`rounded-[20px] overflow-hidden ${isDark ? 'bg-zinc-900 border border-white/5' : 'bg-white'}`}>
                        {title && (
                            <View className={`items-center py-4 border-b ${isDark ? 'border-white/5' : 'border-zinc-50'}`}>
                                <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest opacity-50">
                                    {title}
                                </Typography>
                            </View>
                        )}

                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={String(option.key)}
                                activeOpacity={0.7}
                                onPress={() => {
                                    onSelect(option.key);
                                    onClose();
                                }}
                                className={`flex-row items-center justify-between px-6 py-4 ${index !== options.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-zinc-50') : ''}`}
                            >
                                <Typography
                                    weight={selectedValue === option.key ? 'bold' : 'medium'}
                                    color={selectedValue === option.key ? 'primary' : 'black'}
                                    className="text-[17px]"
                                >
                                    {option.label}
                                </Typography>
                                {selectedValue === option.key && (
                                    <TickCircle size={22} color="#6366f1" variant="Bold" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.7}
                        className={`mt-2.5 h-14 rounded-[20px] items-center justify-center ${isDark ? 'bg-zinc-900 border border-white/5' : 'bg-white'}`}
                    >
                        <Typography weight="bold" className="text-[17px] text-blue-500">
                            Cancel
                        </Typography>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
