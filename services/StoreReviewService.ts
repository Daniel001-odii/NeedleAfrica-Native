import * as StoreReview from 'expo-store-review';
import { Platform, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// CRITICAL: Ensure these IDs match your actual store identifiers
const APP_STORE_ID = "6759835205"; 
const PLAY_STORE_ID = "com.needleafrica.app";

export class StoreReviewService {
    /**
     * Prompts for a store review using the native in-app review dialog.
     * On Android, if the in-app review is not supported, it falls back to opening the Play Store.
     * @param force If true, will not check limits or availability (use for manual triggers)
     */
    static async requestReview(force = false) {
        try {
            console.log(`[StoreReviewService] requestReview called (force: ${force})`);

            // Manual trigger fallback for devices without store review support or when forcing bypass
            if (force) {
                console.log("[StoreReviewService] forcing store page open");
                this.openStorePage();
                return;
            }

            // For auto-prompts, we should check if we already asked recently to avoid OS throttling
            const lastAskedRaw = await SecureStore.getItemAsync('last_store_review_ask');
            const now = Date.now();
            
            if (lastAskedRaw) {
                const lastAsked = parseInt(lastAskedRaw, 10);
                const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                if (now - lastAsked < thirtyDays) {
                    console.log("[StoreReviewService] skipping auto-prompt: asked within last 30 days");
                    return;
                }
            }

            // Use isAvailableAsync instead of hasAction because hasAction can fail on Android
            const isAvailable = await StoreReview.isAvailableAsync();
            console.log(`[StoreReviewService] isAvailable: ${isAvailable}`);

            if (isAvailable) {
                // Check if we can actually request a review (e.g. not in dev mode or within quota)
                const hasAction = await StoreReview.hasAction();
                console.log(`[StoreReviewService] hasAction: ${hasAction}`);

                await StoreReview.requestReview();
                await SecureStore.setItemAsync('last_store_review_ask', now.toString());
            } else {
                console.log("[StoreReviewService] native review not available on this device");
            }
        } catch (error) {
            console.error("[StoreReviewService] requestReview failed:", error);
            if (force) this.openStorePage();
        }
    }

    /**
     * Directly opens the app's store page
     */
    static openStorePage() {
        // itms-apps is the custom scheme to open the App Store app directly
        // The action=write-review parameter takes the user straight to the review composer
        const url = Platform.OS === 'ios'
            ? `itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`
            : `market://details?id=${PLAY_STORE_ID}`;

        const fallbackUrl = Platform.OS === 'ios'
            ? `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`
            : `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;

        console.log(`[StoreReviewService] opening store URL: ${url}`);

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                console.log(`[StoreReviewService] scheme not supported, falling back to web: ${fallbackUrl}`);
                Linking.openURL(fallbackUrl);
            }
        }).catch(err => {
            console.error("[StoreReviewService] Failed to open store page:", err);
            // Last resort fallback
            Linking.openURL(fallbackUrl);
        });
    }
}
