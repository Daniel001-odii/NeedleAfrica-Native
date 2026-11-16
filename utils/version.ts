/**
 * Compares two semantic version strings.
 * Returns true if candidateVersion is strictly newer than currentVersion.
 * 
 * Handles versions with leading zeros (e.g. "2.0.08" vs "2.0.09" or "2.1.0"),
 * optional leading "v", and differing segment lengths (e.g. "2.0" vs "2.0.1").
 */
export function isNewerVersion(candidateVersion?: string, currentVersion?: string): boolean {
    if (!candidateVersion || !currentVersion) return false;

    // Clean strings (remove leading 'v' if present and trim whitespace)
    const cleanCand = candidateVersion.replace(/^v/i, '').trim();
    const cleanCurr = currentVersion.replace(/^v/i, '').trim();

    if (cleanCand === cleanCurr) return false;

    // Split into numerical segments
    const candParts = cleanCand.split('.').map(p => parseInt(p, 10) || 0);
    const currParts = cleanCurr.split('.').map(p => parseInt(p, 10) || 0);

    const maxLen = Math.max(candParts.length, currParts.length);
    for (let i = 0; i < maxLen; i++) {
        const c = candParts[i] ?? 0;
        const cur = currParts[i] ?? 0;
        if (c > cur) return true;
        if (c < cur) return false;
    }

    return false;
}
