import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Q } from '@nozbe/watermelondb';


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

        if (reminderDays < 0) return;

        // 2. Calculate initial trigger time
        const triggerDate = new Date(deliveryDate);
        if (reminderDays > 0) {
            triggerDate.setDate(triggerDate.getDate() - reminderDays);
            triggerDate.setHours(9, 0, 0, 0); // Start at 9:00 AM on the reminder day
        }

        const now = Date.now();

        // 3. Logic: If still far in future, schedule just the first one
        // If within or past the reminder window, schedule the 2-hour pestering reminders
        if (triggerDate.getTime() > now) {
            // Future reminder: Schedule just one
            await this.scheduleSingle(orderId, customerName, triggerDate, deliveryDate, 0);
            console.log(`Scheduled future single reminder for order ${orderId} at ${triggerDate.toLocaleString()}`);
            return;
        }

        // 4. Past or Current reminder: Schedule pestering loop (every 2 hours)
        // Schedule next 10 occurrences to cover ~20 hours
        const remindersCount = 10;
        const intervalMs = 2 * 60 * 60 * 1000;

        for (let i = 0; i < remindersCount; i++) {
            // Find the next 2-hour slot relative to 'now' or 'triggerDate'
            // Using 'now' but aligned to the 2-hour interval from triggerDate
            const offset = Math.ceil((now - triggerDate.getTime()) / intervalMs);
            const nextSlotIndex = Math.max(0, offset + i);
            const currentTrigger = new Date(triggerDate.getTime() + (nextSlotIndex * intervalMs));

            await this.scheduleSingle(orderId, customerName, currentTrigger, deliveryDate, nextSlotIndex);
        }

        console.log(`Scheduled pestering for order ${orderId} starting from ${now}`);
    }

    private static async scheduleSingle(
        orderId: string,
        customerName: string,
        trigger: Date,
        deliveryDate: Date,
        index: number
    ) {
        try {
            const isOverdue = trigger > deliveryDate;
            const title = isOverdue ? "Overdue Delivery! ⚠️" : "Upcoming Delivery 🧵";
            const body = isOverdue
                ? `Order for ${customerName} is PAST DUE. Please complete it.`
                : `Order for ${customerName} is due soon. Check details.`;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: { orderId, index },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: trigger,
                },
            });
        } catch (e) {
            console.error(`Failed to schedule single reminder for order ${orderId}:`, e);
        }
    }

    static async refreshAllReminders(orders: any[], user: any) {
        console.log(`Refreshing local reminders for ${orders.length} orders...`);
        const activeStatuses = ['PENDING', 'DELIVERING', 'READY'];

        for (const order of orders) {
            try {
                if (activeStatuses.includes(order.status) && order.deliveryDate) {
                    // Safe fetch: query by ID instead of using relation.fetch()
                    // which throws Diagnostic Error if record is missing in some versions/states
                    const customerId = order.customerId;
                    let customer = null;

                    if (customerId) {
                        const customers = await order.collections.get('customers')
                            .query(Q.where('id', customerId))
                            .fetch();
                        customer = customers.length > 0 ? customers[0] : null;
                    }

                    const reminderDays = parseInt((!user?.reminderDays || user?.reminderDays === '0') ? '1' : user?.reminderDays);

                    await this.scheduleDeliveryReminder(
                        order.id,
                        customer?.fullName || 'Customer',
                        order.deliveryDate,
                        isNaN(reminderDays) ? 1 : reminderDays
                    );
                } else {
                    // Cancel if no longer active
                    await this.cancelOrderReminders(order.id);
                }
            } catch (e) {
                console.error(`Error processing reminders for order ${order.id}:`, e);
                // Optionally cancel reminders for problematic orders to be safe
                await this.cancelOrderReminders(order.id).catch(() => { });
            }
        }

        // Schedule Daily Smart Reminders
        await this.scheduleSmartReminders(orders);
    }

    static async scheduleSmartReminders(orders: any[]) {
        try {
            // Cancel existing smart reminders to avoid duplicates
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const notification of scheduled) {
                if (notification.content.data?.type === 'smart_reminder') {
                    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                }
            }

            const pendingOrders = orders.filter(o => ['PENDING', 'READY'].includes(o.status));
            const hasPending = pendingOrders.length > 0;

            const owingOrders = orders.filter(o => {
                const balance = typeof o.balance === 'number' ? o.balance : ((o.amount || 0) - (o.amountPaid || 0));
                return balance > 0;
            });

            // 1. Morning Reminder (8 AM)
            const morningTitle = "Good Morning! 🧵";
            const morningBody = hasPending
                ? `You have ${pendingOrders.length} orders to work on. Let's crush those deadlines today! ✨`
                : "Ready for a productive day? Start recording new orders to enable smart reminders. 📈";

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: morningTitle,
                    body: morningBody,
                    data: { type: 'smart_reminder', time: '8AM' },
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: 8,
                    minute: 0,
                } as Notifications.DailyTriggerInput,
            });

            // 2. Evening Reminder (8 PM)
            const eveningTitle = "Daily Wrap-up 🌙";
            const eveningBody = "Time to wind down! Don't forget to record today's work and any pending debts while fresh in your mind. 📝💰";

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: eveningTitle,
                    body: eveningBody,
                    data: { type: 'smart_reminder', time: '8PM' },
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: 20,
                    minute: 0,
                } as Notifications.DailyTriggerInput,
            });

            // 3. Debt Reminder (12 PM)
            if (owingOrders.length > 0) {
                const firstOrder = owingOrders[0];
                let customerName = 'a client';

                try {
                    if (firstOrder.customerId && firstOrder.collections) {
                        const customers = await firstOrder.collections.get('customers')
                            .query(Q.where('id', firstOrder.customerId))
                            .fetch();
                        if (customers.length > 0 && customers[0].fullName) {
                            customerName = customers[0].fullName;
                        }
                    }
                } catch (e) {
                    console.log("Could not fetch customer name for debt reminder", e);
                }

                const remainingCount = owingOrders.length - 1;
                const debtTitle = "Outstanding Balances 💰";
                const debtBody = remainingCount > 0 
                    ? `Reminder for debts owed by ${customerName} and ${remainingCount} other${remainingCount > 1 ? 's' : ''}.`
                    : `Reminder for debt owed by ${customerName}.`;

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: debtTitle,
                        body: debtBody,
                        data: { type: 'smart_reminder', time: '12PM' },
                        sound: true,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DAILY,
                        hour: 12,
                        minute: 0,
                    } as Notifications.DailyTriggerInput,
                });
            }

            console.log("Smart reminders scheduled successfully.");
        } catch (e) {
            console.error("Failed to schedule smart reminders:", e);
        }
    }

    static async testSmartReminders(hasPending: boolean = true) {
        // Trigger both immediately for testing
        const morningBody = hasPending
            ? "You have pending orders to work on. Let's crush those deadlines today! ✨"
            : "Ready for a productive day? Start recording new orders to enable smart reminders. 📈";

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Test: Morning Reminder 🧵",
                body: morningBody,
                data: { type: 'test' },
                sound: true,
            },
            trigger: null, // trigger immediately
        });

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Test: Evening Reminder 🌙",
                body: "Time to wind down! Don't forget to record today's work and any pending debts while fresh in your mind. 📝💰",
                data: { type: 'test' },
                sound: true,
            },
            trigger: { 
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 2,
                repeats: false 
            } as Notifications.TimeIntervalTriggerInput,
        });
    }

    static async cancelOrderReminders(orderId: string) {
        try {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const notification of scheduled) {
                const data = notification.content.data;
                if (data && data.orderId === orderId) {
                    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                }
            }
            console.log(`Cancelled all reminders for order ${orderId}`);
        } catch (e) {
            console.error("Failed to cancel notifications:", e);
        }
    }
}
