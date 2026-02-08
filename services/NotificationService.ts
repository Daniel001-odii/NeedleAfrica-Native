import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications should be handled when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export class NotificationService {
    static async registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }

            try {
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
                if (!projectId) {
                    throw new Error('Project ID not found in expo config');
                }
                token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            } catch (e) {
                console.error('Error fetching push token:', e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }

    static addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    static addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    static removeNotificationSubscription(subscription: Notifications.Subscription) {
        subscription.remove();
    }

    static async scheduleDeliveryReminder(
        orderId: string,
        customerName: string,
        deliveryDate: Date,
        reminderDays: number = 1
    ) {
        // 1. Cancel any existing reminders for this order to avoid duplicates
        await this.cancelOrderReminders(orderId);

        if (reminderDays <= 0) return;

        // 2. Calculate trigger time
        const triggerDate = new Date(deliveryDate);
        triggerDate.setDate(triggerDate.getDate() - reminderDays);
        triggerDate.setHours(9, 0, 0, 0); // Remind at 9:00 AM

        // Don't schedule if date is in the past
        if (triggerDate.getTime() < Date.now()) return;

        try {
            console.log(`Scheduling local notification for order ${orderId} at ${triggerDate.toLocaleString()}`);
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Upcoming Delivery 🧵",
                    body: `Order for ${customerName} is due in ${reminderDays} day(s).`,
                    data: { orderId },
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: triggerDate,
                },
            });
            console.log(`Successfully scheduled reminder for order ${orderId}, ID: ${id}`);
            return id;
        } catch (e) {
            console.error("Failed to schedule notification. Error details:", JSON.stringify(e, null, 2));
        }
    }

    static async cancelOrderReminders(orderId: string) {
        try {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const notification of scheduled) {
                const data = notification.content.data;
                if (data && data.orderId === orderId) {
                    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                    console.log(`Cancelled reminder for order ${orderId}`);
                }
            }
        } catch (e) {
            console.error("Failed to cancel notifications:", e);
        }
    }
}
