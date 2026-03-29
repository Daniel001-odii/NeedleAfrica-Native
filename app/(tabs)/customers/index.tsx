import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, FlatList, Pressable, TextInput, Linking, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCustomers } from '../../../hooks/useCustomers';
import { Add, SearchNormal, User, ArrowRight, Call, Refresh, FilterSearch, InfoCircle } from 'iconsax-react-native';
import { Surface } from '../../../components/ui/Surface';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';

import { useConfirm } from '../../../contexts/ConfirmContext';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash } from 'iconsax-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useResourceLimits } from '../../../hooks/useResourceLimits';

type SortOption = 'recent' | 'oldest' | 'a-z' | 'z-a';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
    { key: 'recent', label: 'Most Recent' },
    { key: 'oldest', label: 'Oldest First' },
    { key: 'a-z', label: 'Name (A-Z)' },
    { key: 'z-a', label: 'Name (Z-A)' },
];

import { ActionSheet } from '../../../components/ui/ActionSheet';

function CustomersScreen() {
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [showSortModal, setShowSortModal] = useState(false);
    const { customers, loading, seedCustomers, refresh, deleteCustomer } = useCustomers(search);
    const { confirm } = useConfirm();
    const router = useRouter();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const { getLimitStatus } = useResourceLimits();
    const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

    const showHelpAnimation = () => {
        const firstId = sortedCustomers[0]?.id;
        if (firstId && swipeableRefs.current[firstId]) {
            swipeableRefs.current[firstId]?.openRight();
            setTimeout(() => {
                swipeableRefs.current[firstId]?.close();
            }, 1000);
        }
    };

    const sortedCustomers = useMemo(() => {
        const sorted = [...customers];
        switch (sortBy) {
            case 'recent':
                return sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
            case 'a-z':
                return sorted.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
            case 'z-a':
                return sorted.sort((a, b) => (b.fullName || '').localeCompare(a.fullName || ''));
            default:
                return sorted;
        }
    }, [customers, sortBy]);

    const isPro = user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'STUDIO_AI';
    const customerLimit = getLimitStatus('customers');

    useEffect(() => {
        if (!loading && sortedCustomers.length > 0) {
            const timer = setTimeout(() => {
                showHelpAnimation();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, sortedCustomers.length === 0]);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const handleCall = (phoneNumber: string | null) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        }
    };

    const handleDelete = (id: string, name: string) => {
        confirm({
            title: "Delete Customer",
            message: `Are you sure you want to delete ${name}?`,
            confirmText: "Delete",
            type: "danger",
            onConfirm: () => deleteCustomer(id)
        });
    };

    const renderRightActions = (id: string, name: string) => {
        return (
            <View className="pl-4 mb-3 justify-center items-center">
                <Pressable
                    onPress={() => handleDelete(id, name)}
                    className="bg-red-500 justify-center items-center w-16 h-16 rounded-2xl"
                >
                    <Trash size={24} color="white" variant="Bold" />
                </Pressable>
            </View>
        );
    };

    const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortBy)?.label || 'Sort';

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
            <View className={`px-6 pt-5 pb-4 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center">
                        <Typography variant="h2" weight="bold">Customers</Typography>
                        {!isPro && (
                            <View className={`ml-3 px-2 py-0.5 rounded-md ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                                <Typography variant="caption" weight="bold" color="gray">
                                    {customerLimit.current}/{customerLimit.limit}
                                </Typography>
                            </View>
                        )}
                    </View>
                    <View className="flex-row gap-4">
                        <TouchableOpacity onPress={() => setShowSortModal(true)}>
                            <FilterSearch size={22} color="#6366f1" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/customers/new')}>
                            <Add size={26} color="#6366f1" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar - Native iOS Look */}
                <Surface variant="muted" className={`flex-row items-center px-3 h-11 border-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} rounded="xl">
                    <SearchNormal size={18} color="#8E8E93" />
                    <TextInput
                        className={`flex-1 ml-2 text-base ${isDark ? 'text-white' : 'text-black'}`}
                        placeholder="Search"
                        placeholderTextColor="#8E8E93"
                        value={search}
                        onChangeText={setSearch}
                    />
                </Surface>
            </View>

            {/* List */}
            <FlatList
                data={sortedCustomers}
                keyExtractor={item => item.id}
                contentContainerClassName="p-4 pt-6 pb-20"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                }
                renderItem={({ item }) => (
                    <Swipeable
                        ref={ref => { swipeableRefs.current[item.id] = ref; }}
                        renderRightActions={() => renderRightActions(item.id, item.fullName || 'Client')}
                        friction={2}
                        rightThreshold={40}
                    >
                        <Pressable
                            onPress={() => router.push({ pathname: '/(tabs)/customers/[id]', params: { id: item.id } })}
                        >
                            <Surface variant="white" className="flex-row items-center p-4 mb-3" rounded="2xl">
                                <View className={`w-12 h-12 items-center justify-center mr-4 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
                                    <Typography weight="bold" color="primary">
                                        {(item.fullName || 'C').charAt(0).toUpperCase()}
                                    </Typography>
                                </View>
                                <View className="flex-1">
                                    <Typography variant="body" weight="bold">{item.fullName}</Typography>
                                    <Typography variant="caption" color="gray" className="mt-0.5">{item.phoneNumber || 'No phone number'}</Typography>
                                </View>
                                {item.phoneNumber && (
                                    <TouchableOpacity
                                        className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? 'bg-zinc-800' : 'bg-green-50'}`}
                                        onPress={() => handleCall(item.phoneNumber || null)}
                                    >
                                        <Call size={18} color="#22c55e" variant="Bold" />
                                    </TouchableOpacity>
                                )}
                                <View className="ml-2">
                                    <ArrowRight size={16} color="#D1D1D6" />
                                </View>
                            </Surface>
                        </Pressable>
                    </Swipeable>
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center justify-center py-20 px-10">
                            <Surface variant="muted" className="w-20 h-20 items-center justify-center mb-6" rounded="full">
                                <User size={32} color="#8E8E93" variant="Bulk" />
                            </Surface>
                            <Typography variant="h3" weight="bold" className="text-center mb-2">No customers</Typography>
                            <Typography variant="body" color="gray" className="text-center">
                                {search ? "Try a different search term" : "Add your first client to get started"}
                            </Typography>
                        </View>
                    ) : null
                }
            />

            <ActionSheet
                visible={showSortModal}
                onClose={() => setShowSortModal(false)}
                title="Sort By"
                options={SORT_OPTIONS}
                selectedValue={sortBy}
                onSelect={setSortBy}
            />
        </View>
    );
}

export default CustomersScreen;