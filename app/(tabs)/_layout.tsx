import { Tabs } from 'expo-router';
import { View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, User, Notepad, People, Calendar, MagicStar } from 'iconsax-react-native';
import { LimitedOfflineBanner } from '../../components/LimitedOfflineBanner';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { isDark } = useTheme();

    return (
        <View className="flex-1">
            <LimitedOfflineBanner />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: isDark ? '#FFFFFF' : '#1C1C1E',
                    tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#9CA3AF',

                    tabBarStyle: {
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        borderTopWidth: 1,
                        borderTopColor: isDark ? '#374151' : '#E5E7EB',
                        height: 60 + (insets.bottom > 10 ? insets.bottom - 30 : insets.bottom), // dynamic height
                        paddingTop: 6,
                        paddingBottom: insets.bottom > 10 ? insets.bottom - 30 : insets.bottom, // safe area aware
                        elevation: 0,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.05,
                        shadowRadius: 12,
                    },

                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        marginTop: 4,
                    },
                }}
            >
                {/* Main tabs */}
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, focused }) => (
                            <Home size={24} color={color} variant={focused ? 'Bold' : 'Linear'} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="customers"
                    options={{
                        title: 'Customers',
                        tabBarIcon: ({ color, focused }) => (
                            <People size={24} color={color} variant={focused ? 'Bold' : 'Linear'} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="orders"
                    options={{
                        title: 'Orders',
                        tabBarIcon: ({ color, focused }) => (
                            <Calendar size={24} color={color} variant={focused ? 'Bold' : 'Linear'} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="extras/index"
                    options={{
                        href: null,
                    }}
                />

                {/*  <Tabs.Screen
                    name="extras/index"
                    options={{
                        title: 'AI Lab',
                        tabBarIcon: ({ color, focused }) => (
                            <MagicStar size={24} color={color} variant={focused ? 'Bold' : 'Linear'} />
                        ),
                    }}
                /> */}

                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color, focused }) => (
                            user?.profilePicture ? (
                                <Image
                                    source={{ uri: user.profilePicture }}
                                    style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: 13,
                                        opacity: focused ? 1 : 0.7
                                    }}
                                />
                            ) : (
                                <User size={24} color={color} variant={focused ? 'Bold' : 'Linear'} />
                            )
                        ),
                    }}
                />

                {/* Hidden screens (no tab button) */}
                {/* Note: Sub-screens are now handled by nested Stacks in profile/ and customers/ directories */}
            </Tabs>
        </View>
    );
}
