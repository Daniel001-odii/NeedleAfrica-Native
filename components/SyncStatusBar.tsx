import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSync } from '../hooks/useSync';

interface SyncStatusBarProps {
  onSyncPress?: () => void;
}

export function SyncStatusBar({ onSyncPress }: SyncStatusBarProps) {
  const { isSyncing, lastSyncedAt, isOnline, sync } = useSync();

  const handleSync = async () => {
    if (onSyncPress) {
      onSyncPress();
    }
    try {
      await sync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const formatLastSync = () => {
    if (!lastSyncedAt) return 'Never synced';
    
    const now = Date.now();
    const diff = now - lastSyncedAt;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusSection}>
        <Text style={[styles.statusText, !isOnline && styles.offlineText]}>
          {isOnline ? '● Online' : '● Offline'}
        </Text>
      </View>

      <View style={styles.syncInfo}>
        {isSyncing ? (
          <View style={styles.syncingRow}>
            <ActivityIndicator size="small" color="#6B7280" />
            <Text style={styles.syncText}>Syncing...</Text>
          </View>
        ) : (
          <Text style={styles.lastSyncText}>
            Last sync: {formatLastSync()}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={handleSync}
        disabled={isSyncing || !isOnline}
        style={[
          styles.syncButton,
          (isSyncing || !isOnline) && styles.syncButtonDisabled
        ]}
      >
        <Text style={styles.syncButtonText}>
          {isSyncing ? 'Syncing' : 'Sync'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  offlineText: {
    color: '#EF4444',
  },
  syncInfo: {
    flex: 1,
    alignItems: 'center',
  },
  syncingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncText: {
    fontSize: 14,
    color: '#6B7280',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#6B7280',
  },
  syncButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  syncButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

// Simple badge component for showing pending sync count
interface PendingSyncBadgeProps {
  count: number;
}

export function PendingSyncBadge({ count }: PendingSyncBadgeProps) {
  if (count === 0) return null;

  return (
    <View style={badgeStyles.container}>
      <Text style={badgeStyles.text}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
