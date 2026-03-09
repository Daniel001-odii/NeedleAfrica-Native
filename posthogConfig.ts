// posthogConfig.ts
import PostHog from 'posthog-react-native'

const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

if (!API_KEY) {
  console.warn('PostHog API Key is missing! Check your .env file or environment variables.');
}

export const posthog = new PostHog(
  API_KEY || '',
  {
    host: HOST,// Automatically captures screen views and taps
    enableSessionReplay: true, // Enables Session Replay
    sessionReplayConfig: {
      maskAllTextInputs: true,  // Mask sensitive inputs
      maskAllImages: false,     // Allow images to be visible in replay (change to true if sensitive)
      captureLog: true,         // Capture console.logs/errors (Android only for now)
      captureNetworkTelemetry: true, // Capture network requests
    }
  }
)