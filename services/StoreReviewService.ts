import * as StoreReview from 'expo-store-review';
import { Platform, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const APP_STORE_ID = "6614131580";
const PLAY_STORE_ID = "com.needleafrica.app";

export class StoreReviewService {
    /**
     * Prompts for a store review using the native in-app review dialog.
     * On Android, if the in-app review is not supported, it falls back to opening the Play Store.
     * @param force If true, will not check limits or availability (use for manual triggers)
     */
    static async requestReview(force = false) {
        try {
            // Manual trigger fallback for devices without store review support
            if (force) {
                const isAvailable = await StoreReview.isAvailableAsync();
                if (isAvailable) {
                    await StoreReview.requestReview();
                    return;
                }
                // Fallback to manual store link
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
                    console.log("[StoreReviewService] skipping auto-prompt: asked recently");
                    return;
                }
            }

            if (await StoreReview.hasAction()) {
                await StoreReview.requestReview();
                await SecureStore.setItemAsync('last_store_review_ask', now.toString());
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
        const url = Platform.OS === 'ios'
            ? `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${APP_STORE_ID}?action=write-review`
            : `market://details?id=${PLAY_STORE_ID}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                // Fallback to web URL if market scheme fails (common on some Android skins)
                const fallbackUrl = Platform.OS === 'ios'
                    ? `https://apps.apple.com/app/id${APP_STORE_ID}`
                    : `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
                Linking.openURL(fallbackUrl);
            }
        }).catch(err => {
            console.error("[StoreReviewService] Failed to open store page:", err);
        });
    }
}
