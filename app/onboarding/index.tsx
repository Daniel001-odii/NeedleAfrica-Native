import React, { useState } from 'react';
import {
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList
} from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import {
    SearchNormal1,
    CloseCircle,
    TickCircle,
    ArrowRight2
} from 'iconsax-react-native';
import { CURRENCIES } from '../../constants/currencies';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';

export default function WorkspaceSetup() {
    const { user, updateProfile, logout } = useAuth();
    const { state, updateState, nextStep, resetOnboarding } = useOnboarding();

    const [businessName, setBusinessName] = useState(state.businessName || user?.businessName || '');
    const [currency, setCurrency] = useState(state.currency || 'NGN');
    const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
    const [currencySearchQuery, setCurrencySearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    const filteredCurrencies = CURRENCIES.filter(c =>
        c.name.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(currencySearchQuery.toLowerCase())
    );

    const isFormValid = businessName.trim().length > 0;

    const handleContinue = async () => {
        if (!isFormValid) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter your business name' });
            return;
        }

        setIsLoading(true);
        try {
            await updateProfile({ businessName: businessName.trim(), currency });

            updateState({ businessName: businessName.trim(), currency, step: 1 });

            nextStep();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save workspace settings' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                <ScrollView
                    contentContainerClassName="p-6 pt-12 pb-20 bg-white"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="mb-8 mt-4">
                        <Typography variant="h1" weight="bold" className="mb-2 text-gray-900">
                            Workspace Setup
                        </Typography>
                        <Typography color="gray" variant="subtitle" className="leading-5">
                            Every great creation starts with a space. Tell us about yours.
                        </Typography>
                    </View>

                    {/* Group: Workspace Info */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Brand Details
                        </Typography>
                        <View className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">

                            {/* Business Name Inline */}
                            <View className="flex-row items-center px-4 py-4 border-b border-gray-50">
                                <Typography weight="semibold" className="text-gray-900 w-1/3 text-[15px]">
                                    Business Name
                                </Typography>
                                <TextInput
                                    className="flex-1 text-right font-semibold text-gray-900 text-[16px]"
                                    placeholder="e.g. NeedleX Couture"
                                    placeholderTextColor="#D1D5DB"
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                    autoCapitalize="words"
                                    returnKeyType="done"
                                />
                            </View>

                            {/* Currency Selection Inline */}
                            <TouchableOpacity
                                onPress={() => setIsCurrencyModalVisible(true)}
                                className="flex-row items-center justify-between px-4 py-4 active:bg-gray-50"
                            >
                                <Typography weight="semibold" className="text-gray-900 text-[15px]">
                                    Default Currency
                                </Typography>
                                <View className="flex-row items-center">
                                    <Typography weight="medium" className="text-[15px] mr-2 text-blue-600">
                                        {selectedCurrency.code} ({selectedCurrency.symbol})
                                    </Typography>
                                    <ArrowRight2 size={16} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>

                        </View>
                        <Typography className="text-[12px] text-gray-400 ml-4 mt-2 pr-4">
                            You can change your default currency later in your settings.
                        </Typography>
                    </View>

                </ScrollView>

                {/* Bottom Action Bar */}
                <View className="p-6 bg-white pt-2 border-t border-gray-50">
                    <Button
                        onPress={handleContinue}
                        isLoading={isLoading}
                        disabled={!isFormValid}
                        className={`h-14 rounded-full border-0 ${!isFormValid ? 'bg-gray-200' : 'bg-blue-600'}`}
                        textClassName={`text-lg font-bold ${!isFormValid ? 'text-gray-400' : 'text-white'}`}
                    >
                        Continue
                    </Button>

                    <View className="mt-5 items-center pb-2">
                        <Typography color="gray" variant="small" weight="medium">Step 1 of 5</Typography>

                        <View className="flex-row items-center mt-5 gap-4">
                            <TouchableOpacity onPress={resetOnboarding} className="px-2">
                                <Typography color="primary" weight="bold" className="text-[13px]">
                                    Restart Setup
                                </Typography>
                            </TouchableOpacity>
                            <View className="w-1 h-1 bg-gray-300 rounded-full" />
                            <TouchableOpacity onPress={() => logout()} className="px-2">
                                <Typography weight="medium" className="text-gray-400 text-[13px]">
                                    Sign Out
                                </Typography>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Currency Selection Bottom Sheet Modal */}
            <Modal
                visible={isCurrencyModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsCurrencyModalVisible(false)}
            >
                <View className="flex-1 bg-black/40 justify-end">
                    <View className="bg-[#F2F2F7] rounded-t-[32px] h-[85%] pb-8">

                        <View className="flex-row justify-between items-center p-6 pb-4">
                            <View className="w-8" />
                            <Typography variant="h3" weight="bold" className="text-gray-900">Select Currency</Typography>
                            <TouchableOpacity onPress={() => setIsCurrencyModalVisible(false)} className="bg-gray-200/80 p-1.5 rounded-full">
                                <CloseCircle size={22} color="#6B7280" variant="Bold" />
                            </TouchableOpacity>
                        </View>

                        <View className="px-4 mb-4">
                            <View className="flex-row items-center bg-gray-200/60 h-10 px-3 rounded-xl">
                                <SearchNormal1 size={18} color="#8E8E93" />
                                <TextInput
                                    className="ml-2 flex-1 text-[16px] text-gray-900"
                                    placeholder="Search currency..."
                                    placeholderTextColor="#8E8E93"
                                    value={currencySearchQuery}
                                    onChangeText={setCurrencySearchQuery}
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        <FlatList
                            data={filteredCurrencies}
                            keyExtractor={(item) => item.code}
                            showsVerticalScrollIndicator={false}
                            contentContainerClassName="px-4 pb-10"
                            renderItem={({ item, index }) => {
                                const isSelected = currency === item.code;
                                const isLast = index === filteredCurrencies.length - 1;

                                return (
                                    <View className={`bg-white ${index === 0 ? 'rounded-t-[24px]' : ''} ${isLast ? 'rounded-b-[24px]' : ''} overflow-hidden`}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setCurrency(item.code);
                                                setIsCurrencyModalVisible(false);
                                                setCurrencySearchQuery('');
                                            }}
                                            className={`flex-row items-center px-4 py-3 active:bg-gray-50 ${!isLast ? 'border-b border-gray-100' : ''}`}
                                        >
                                            <View className="w-10 h-10 items-center justify-center bg-blue-50/50 rounded-xl mr-4 border border-blue-100/30">
                                                <Typography weight="bold" className="text-[16px] text-gray-700">
                                                    {item.symbol}
                                                </Typography>
                                            </View>
                                            <View className="flex-1">
                                                <Typography weight={isSelected ? "bold" : "semibold"} className={`text-[15px] ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                                                    {item.name}
                                                </Typography>
                                                <Typography color="gray" className="text-[12px] mt-0.5">
                                                    {item.code}
                                                </Typography>
                                            </View>
                                            {isSelected && (
                                                <TickCircle size={22} color="#2563EB" variant="Bold" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={() => (
                                <View className="items-center py-10">
                                    <Typography color="gray" className="text-[15px]">No currencies found</Typography>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}