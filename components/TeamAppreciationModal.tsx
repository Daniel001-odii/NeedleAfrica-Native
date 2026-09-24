import React from 'react';
import {
    View,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
} from 'react-native';
import { Typography } from './ui/Typography';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Animated, {
    FadeInUp,
    FadeInDown,
} from 'react-native-reanimated';
import {
    Heart,
    MagicStar,
    TickCircle,
} from 'iconsax-react-native';

interface TeamAppreciationModalProps {
    visible: boolean;
    onClose: () => void;
}

export const TeamAppreciationModal: React.FC<TeamAppreciationModalProps> = ({
    visible,
    onClose,
}) => {
    const { isDark } = useTheme();
    const { user } = useAuth();

    if (!visible) return null;

    const displayName = user?.businessName || user?.username || 'Fashion Creator';

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 bg-black/75 justify-center items-center px-4">
                    <TouchableWithoutFeedback>
                        <Animated.View
                            entering={FadeInUp.duration(320).springify().damping(18)}
                            className={`w-full max-w-[390px] rounded-[32px] p-6 shadow-2xl border ${
                                isDark
                                    ? 'bg-[#18181B] border-white/10'
                                    : 'bg-white border-gray-100'
                            }`}
                        >
                            {/* Top Floating Badge */}
                            <View className="items-center mb-3">
                                <Animated.View
                                    entering={FadeInDown.delay(100).duration(280)}
                                    className={`w-16 h-16 rounded-2xl items-center justify-center mb-3 shadow-sm ${
                                        isDark
                                            ? 'bg-rose-500/15 border border-rose-500/20'
                                            : 'bg-rose-50 border border-rose-100'
                                    }`}
                                >
                                    <Heart size={34} color="#F43F5E" variant="Bold" />
                                </Animated.View>

                                <View className="bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full flex-row items-center gap-1.5 mb-1">
                                    <MagicStar size={13} color="#F43F5E" variant="Bold" />
                                    <Typography
                                        variant="small"
                                        weight="bold"
                                        className="text-rose-600 dark:text-rose-400 text-[10px] uppercase tracking-wider"
                                    >
                                        From The NeedleX Team
                                    </Typography>
                                </View>

                                <Typography variant="h2" weight="bold" className="text-center text-[22px] tracking-tight">
                                    We Truly Appreciate You
                                </Typography>
                            </View>

                            {/* Letter Body */}
                            <View
                                className={`p-4 rounded-2xl mb-5 border ${
                                    isDark
                                        ? 'bg-white/5 border-white/5'
                                        : 'bg-zinc-50 border-zinc-100'
                                }`}
                            >
                                <Typography
                                    variant="body"
                                    weight="bold"
                                    className="mb-2 text-[14px]"
                                >
                                    Dear {displayName},
                                </Typography>

                                <Typography
                                    variant="small"
                                    color="gray"
                                    className="leading-5 text-[13px] mb-3"
                                >
                                    Taking out time from your busy schedule to answer our survey means everything to us.
                                </Typography>

                                <Typography
                                    variant="small"
                                    color="gray"
                                    className="leading-5 text-[13px] mb-3"
                                >
                                    NeedleX exists to elevate African fashion designers and tailors. Every thought, pain point, and suggestion you just shared will directly shape the features, tools, and updates we roll out next.
                                </Typography>

                                <Typography
                                    variant="small"
                                    color="gray"
                                    className="leading-5 text-[13px] mb-4"
                                >
                                    We remain deeply committed to building the very best experience for your business. Thank you for walking this journey with us and for helping us shape the future of African fashion.
                                </Typography>

                                {/* Signature Block */}
                                <View className="pt-2 border-t border-dashed border-gray-200 dark:border-zinc-800 flex-row items-center justify-between">
                                    <View>
                                        <Typography variant="small" weight="bold" className="text-[12px]">
                                            With gratitude & respect,
                                        </Typography>
                                        <Typography variant="caption" color="gray" className="text-[11px]">
                                            The NeedleX Founding Team
                                        </Typography>
                                    </View>
                                    <View className="w-8 h-8 rounded-full bg-brand-primary/10 items-center justify-center">
                                        <TickCircle size={18} color="#2563EB" variant="Bold" />
                                    </View>
                                </View>
                            </View>

                            {/* CTA Action */}
                            <TouchableOpacity
                                onPress={onClose}
                                activeOpacity={0.85}
                                className="w-full bg-brand-primary py-4 rounded-full items-center justify-center shadow-sm"
                            >
                                <Typography variant="body" weight="bold" color="white" className="text-[15px]">
                                    Continue to NeedleX
                                </Typography>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default TeamAppreciationModal;
