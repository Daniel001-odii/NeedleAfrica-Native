import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Add, ArrowLeft, Notification, SidebarRight, Receipt2, Trash } from 'iconsax-react-native';
import { router } from 'expo-router';
import { Typography } from '../components/ui/Typography';
import { IconButton } from '../components/ui/IconButton';
import { useTheme } from '../contexts/ThemeContext';

export default function NotificationsScreen() {
    const { isDark } = useTheme();

    // Mock Notifications - In a real app, these would come from your DB/API
    const mockNotifications: any[] = [
        /* 
        {
            id: '1',
            title: 'Low Stock Alert',
            message: 'You are running low on "Blue Silk" fabric. 2 meters remaining.',
            time: '2 mins ago',
            icon: <SidebarRight size={24} color="#f97316" variant="Bulk" />,
            type: 'alert',
            read: false,
        },
        {
            id: '2',
            title: 'Payment Received',
            message: 'Aisha Bello just paid ₦45,000 for Order #NDL-882.',
            time: '1 hour ago',
            icon: <Receipt2 size={24} color="#3b82f6" variant="Bulk" />,
            type: 'success',
            read: false,
        },
        {
            id: '3',
            title: 'Order Overdue',
            message: 'Order #NDL-712 is past its deadline. Contact the client.',
            time: '3 hours ago',
            icon: <Notification size={24} color="#ef4444" variant="Bulk" />,
            type: 'error',
            read: true,
        },
        */
    ];

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <SafeAreaView edges={['top']} className="flex-1">
                {/* Header */}
                <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                    <View className="flex-row items-center">
                        <IconButton
                            icon={<Add size={24} color={isDark ? 'white' : 'black'} style={{ transform: [{ rotate: '45deg' }] }} />}
                            onPress={() => router.back()}
                            variant="ghost"
                            className="-ml-4"
                        />
                        <Typography variant="h3" weight="bold" className="ml-2">Notifications</Typography>
                    </View>
                    <IconButton
                        icon={<Trash size={20} color="#9CA3AF" variant="Linear" />}
                        onPress={() => {}}
                        variant="ghost"
                    />
                </View>

                {/* List */}
                <ScrollView 
                    className="flex-1"
                    contentContainerClassName="p-6 pb-20"
                    showsVerticalScrollIndicator={false}
                >
                    {mockNotifications.length > 0 ? (
                        mockNotifications.map((note) => (
                            <TouchableOpacity 
                                key={note.id}
                                className={`mb-4 flex-row p-4 rounded-3xl border ${
                                    isDark 
                                    ? 'bg-zinc-900 border-zinc-800' 
                                    : (note.read ? 'bg-white border-gray-50' : 'bg-blue-50/50 border-blue-100')
                                }`}
                            >
                                <View className={`w-12 h-12 rounded-[18px] items-center justify-center mr-4 ${
                                    isDark ? 'bg-zinc-800' : 'bg-white shadow-sm'
                                }`}>
                                    {note.icon}
                                </View>
                                <View className="flex-1 py-1">
                                    <View className="flex-row justify-between items-center mb-1">
                                        <Typography variant="body" weight="bold" className={isDark ? 'text-white' : 'text-zinc-900'}>
                                            {note.title}
                                        </Typography>
                                        <Typography variant="small" color="gray" weight="medium">
                                            {note.time}
                                        </Typography>
                                    </View>
                                    <Typography variant="small" color="gray" className="leading-5">
                                        {note.message}
                                    </Typography>
                                </View>
                                {!note.read && <View className="w-2 h-2 rounded-full bg-blue-600 mt-2 ml-2" />}
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="items-center justify-center py-20">
                            <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                                <Notification size={40} color="#9CA3AF" variant="Bulk" />
                            </View>
                            <Typography variant="subtitle" weight="bold" color="gray">All caught up!</Typography>
                            <Typography variant="small" color="gray" className="mt-2 text-center px-10">
                                You don't have any new notifications at the moment.
                            </Typography>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
