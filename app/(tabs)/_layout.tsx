import { Tabs } from 'expo-router';
import { View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, User, Notepad, People, Calendar, MagicStar } from 'iconsax-react-native';
import { LimitedOfflineBanner } from '../../components/LimitedOfflineBanner';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    return (
        <View className="flex-1">
            <LimitedOfflineBanner />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#1C1C1E',
                    tabBarInactiveTintColor: '#9CA3AF',

                    tabBarStyle: {
                        backgroundColor: '#FFFFFF',
                        borderTopWidth: 1,
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
                                <View style={{
                                    borderWidth: focused ? 2 : 0,
                                    borderColor: color,
                                    borderRadius: 12,
                                    padding: 1
                                }}>
                                    <Image
                                        source={{ uri: user.profilePicture }}
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 11
                                        }}
                                    />
                                </View>
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
