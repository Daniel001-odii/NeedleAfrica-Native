import { database } from '../database/watermelon';
import Customer from '../database/watermelon/models/Customer';
import Measurement from '../database/watermelon/models/Measurement';
import Order from '../database/watermelon/models/Order';
import axiosInstance from '../lib/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Q } from '@nozbe/watermelondb';

interface SyncChanges {
  customers: {
    created: any[];
    updated: any[];
    deleted: { id: string; deletedAt: number }[];
  };
  measurements: {
    created: any[];
    updated: any[];
    deleted: { id: string; deletedAt: number }[];
  };
  orders: {
    created: any[];
    updated: any[];
    deleted: { id: string; deletedAt: number }[];
  };
}

class SyncService {
  private static instance: SyncService;
  private isSyncing = false;
  private syncQueue: Promise<void> | null = null;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async getLastSyncedAt(): Promise<number> {
    try {
      const lastSynced = await AsyncStorage.getItem('lastSyncedAt');
      return lastSynced ? parseInt(lastSynced, 10) : 0;
    } catch (error) {
      console.error('Error getting last synced timestamp:', error);
      return 0;
    }
  }

  async setLastSyncedAt(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem('lastSyncedAt', timestamp.toString());
    } catch (error) {
      console.error('Error setting last synced timestamp:', error);
    }
  }

  async getPendingChanges(): Promise<SyncChanges> {
    const changes: SyncChanges = {
      customers: { created: [], updated: [], deleted: [] },
      measurements: { created: [], updated: [], deleted: [] },
      orders: { created: [], updated: [], deleted: [] },
    };

    try {
      // Get pending customers
      const pendingCustomers = await database
        .get('customers')
        .query(Q.where('sync_status', 'created'))
        .fetch();
      
      const deletedCustomers = await database
        .get('customers')
        .query(Q.where('deleted_at', Q.notEq(null)))
        .fetch();
      
      const allCustomers = [...pendingCustomers, ...deletedCustomers];

      for (const customer of allCustomers) {
        const record = customer as any;
        const customerData = {
          id: record.id,
          userId: record.userId,
          fullName: record.fullName,
          phoneNumber: record.phoneNumber,
          gender: record.gender,
          notes: record.notes,
          createdAt: record.createdAt.getTime(),
          updatedAt: record.updatedAt.getTime(),
          deletedAt: record.deletedAt,
        };

        if (record.deletedAt) {
          changes.customers.deleted.push({
            id: record.id,
            deletedAt: record.deletedAt,
          });
        } else if (record.syncStatus === 'created') {
          changes.customers.created.push(customerData);
        }
      }

      // Get pending measurements
      const pendingMeasurements = await database
        .get('measurements')
        .query(Q.where('sync_status', 'created'))
        .fetch();
      
      const deletedMeasurements = await database
        .get('measurements')
        .query(Q.where('deleted_at', Q.notEq(null)))
        .fetch();
      
      const allMeasurements = [...pendingMeasurements, ...deletedMeasurements];

      for (const measurement of allMeasurements) {
        const record = measurement as any;
        const measurementData = {
          id: record.id,
          userId: record.userId,
          customerId: record.customerId,
          title: record.title,
          valuesJson: record.valuesJson,
          createdAt: record.createdAt.getTime(),
          updatedAt: record.updatedAt.getTime(),
          deletedAt: record.deletedAt,
        };

        if (record.deletedAt) {
          changes.measurements.deleted.push({
            id: record.id,
            deletedAt: record.deletedAt,
          });
        } else if (record.syncStatus === 'created') {
          changes.measurements.created.push(measurementData);
        }
      }

      // Get pending orders
      const pendingOrders = await database
        .get('orders')
        .query(Q.where('sync_status', 'created'))
        .fetch();
      
      const deletedOrders = await database
        .get('orders')
        .query(Q.where('deleted_at', Q.notEq(null)))
        .fetch();
      
      const allOrders = [...pendingOrders, ...deletedOrders];

      for (const order of allOrders) {
        const record = order as any;
        const orderData = {
          id: record.id,
          userId: record.userId,
          customerId: record.customerId,
          styleName: record.styleName,
          deliveryDate: record.deliveryDate ? record.deliveryDate.getTime() : null,
          status: record.status,
          amount: record.amount,
          notes: record.notes,
          createdAt: record.createdAt.getTime(),
          updatedAt: record.updatedAt.getTime(),
          deletedAt: record.deletedAt,
        };

        if (record.deletedAt) {
          changes.orders.deleted.push({
            id: record.id,
            deletedAt: record.deletedAt,
          });
        } else if (record.syncStatus === 'created') {
          changes.orders.created.push(orderData);
        }
      }
    } catch (error) {
      console.error('Error getting pending changes:', error);
    }

    return changes;
  }

  async pushChanges(lastSyncedAt: number): Promise<void> {
    const changes = await this.getPendingChanges();

    // Only push if there are changes
    const hasChanges = 
      changes.customers.created.length > 0 ||
      changes.customers.deleted.length > 0 ||
      changes.measurements.created.length > 0 ||
      changes.measurements.deleted.length > 0 ||
      changes.orders.created.length > 0 ||
      changes.orders.deleted.length > 0;

    if (!hasChanges) {
      return;
    }

    try {
      const response = await axiosInstance.post('/sync/push', {
        lastSyncedAt,
        changes,
      });

      if (response.data.success) {
        // Mark synced records as synced
        await this.markRecordsAsSynced(changes);
      }
    } catch (error) {
      console.error('Error pushing changes:', error);
      throw error;
    }
  }

  async pullChanges(lastSyncedAt: number): Promise<void> {
    try {
      const response = await axiosInstance.post('/sync/pull', {
        lastSyncedAt,
      });

      const { changes, timestamp } = response.data;

      // Apply server changes locally
      await this.applyServerChanges(changes);

      // Update last synced timestamp
      await this.setLastSyncedAt(timestamp);
    } catch (error) {
      console.error('Error pulling changes:', error);
      throw error;
    }
  }

  async markRecordsAsSynced(changes: SyncChanges): Promise<void> {
    try {
      await database.write(async () => {
        // Mark customers as synced
        for (const customer of changes.customers.created) {
          const record = await database.get('customers').find(customer.id);
          await record.update((record: any) => {
            record.syncStatus = 'synced';
          });
        }

        // Remove deleted customers
        for (const deleted of changes.customers.deleted) {
          try {
            const record = await database.get('customers').find(deleted.id);
            await record.markAsDeleted(); // This will permanently delete the record
          } catch (error) {
            // Record might not exist locally, which is fine
          }
        }

        // Mark measurements as synced
        for (const measurement of changes.measurements.created) {
          const record = await database.get('measurements').find(measurement.id);
          await record.update((record: any) => {
            record.syncStatus = 'synced';
          });
        }

        // Remove deleted measurements
        for (const deleted of changes.measurements.deleted) {
          try {
            const record = await database.get('measurements').find(deleted.id);
            await record.markAsDeleted();
          } catch (error) {
            // Record might not exist locally
          }
        }

        // Mark orders as synced
        for (const order of changes.orders.created) {
          const record = await database.get('orders').find(order.id);
          await record.update((record: any) => {
            record.syncStatus = 'synced';
          });
        }

        // Remove deleted orders
        for (const deleted of changes.orders.deleted) {
          try {
            const record = await database.get('orders').find(deleted.id);
            await record.markAsDeleted();
          } catch (error) {
            // Record might not exist locally
          }
        }
      });
    } catch (error) {
      console.error('Error marking records as synced:', error);
      throw error;
    }
  }

  async applyServerChanges(changes: any): Promise<void> {
    try {
      await database.write(async () => {
        // Apply customer changes
        for (const customer of changes.customers.created) {
          const existingRecord = await database.get('customers').find(customer.id).catch(() => null);
          
          if (existingRecord) {
            // Update existing record if server version is newer
            const existingTime = (existingRecord as any).updatedAt.getTime();
            if (customer.updatedAt > existingTime) {
              await existingRecord.update((record: any) => {
                record.fullName = customer.fullName;
                record.phoneNumber = customer.phoneNumber;
                record.gender = customer.gender;
                record.notes = customer.notes;
                record.deletedAt = customer.deletedAt;
                record.syncStatus = 'synced';
                record.updatedAt = new Date(customer.updatedAt);
              });
            }
          } else if (!customer.deletedAt) {
            // Create new record if not deleted
            await database.get('customers').create((record: any) => {
              record.id = customer.id;
              record.userId = customer.userId;
              record.fullName = customer.fullName;
              record.phoneNumber = customer.phoneNumber;
              record.gender = customer.gender;
              record.notes = customer.notes;
              record.deletedAt = customer.deletedAt;
              record.syncStatus = 'synced';
              record.createdAt = new Date(customer.createdAt);
              record.updatedAt = new Date(customer.updatedAt);
            });
          }
        }

        // Apply measurement changes
        for (const measurement of changes.measurements.created) {
          const existingRecord = await database.get('measurements').find(measurement.id).catch(() => null);
          
          if (existingRecord) {
            const existingTime = (existingRecord as any).updatedAt.getTime();
            if (measurement.updatedAt > existingTime) {
              await existingRecord.update((record: any) => {
                record.customerId = measurement.customerId;
                record.title = measurement.title;
                record.valuesJson = measurement.valuesJson;
                record.deletedAt = measurement.deletedAt;
                record.syncStatus = 'synced';
                record.updatedAt = new Date(measurement.updatedAt);
              });
            }
          } else if (!measurement.deletedAt) {
            await database.get('measurements').create((record: any) => {
              record.id = measurement.id;
              record.userId = measurement.userId;
              record.customerId = measurement.customerId;
              record.title = measurement.title;
              record.valuesJson = measurement.valuesJson;
              record.deletedAt = measurement.deletedAt;
              record.syncStatus = 'synced';
              record.createdAt = new Date(measurement.createdAt);
              record.updatedAt = new Date(measurement.updatedAt);
            });
          }
        }

        // Apply order changes
        for (const order of changes.orders.created) {
          const existingRecord = await database.get('orders').find(order.id).catch(() => null);
          
          if (existingRecord) {
            const existingTime = (existingRecord as any).updatedAt.getTime();
            if (order.updatedAt > existingTime) {
              await existingRecord.update((record: any) => {
                record.customerId = order.customerId;
                record.styleName = order.styleName;
                record.deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
                record.status = order.status;
                record.amount = order.amount;
                record.notes = order.notes;
                record.deletedAt = order.deletedAt;
                record.syncStatus = 'synced';
                record.updatedAt = new Date(order.updatedAt);
              });
            }
          } else if (!order.deletedAt) {
            await database.get('orders').create((record: any) => {
              record.id = order.id;
              record.userId = order.userId;
              record.customerId = order.customerId;
              record.styleName = order.styleName;
              record.deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
              record.status = order.status;
              record.amount = order.amount;
              record.notes = order.notes;
              record.deletedAt = order.deletedAt;
              record.syncStatus = 'synced';
              record.createdAt = new Date(order.createdAt);
              record.updatedAt = new Date(order.updatedAt);
            });
          }
        }
      });
    } catch (error) {
      console.error('Error applying server changes:', error);
      throw error;
    }
  }

  async sync(): Promise<void> {
    if (this.isSyncing) {
      // If already syncing, wait for current sync to complete
      if (this.syncQueue) {
        await this.syncQueue;
      }
      return;
    }

    this.isSyncing = true;
    this.syncQueue = this.performSync();
    
    try {
      await this.syncQueue;
    } finally {
      this.isSyncing = false;
      this.syncQueue = null;
    }
  }

  private async performSync(): Promise<void> {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('No network connection, skipping sync');
        return;
      }

      const lastSyncedAt = await this.getLastSyncedAt();

      // Step 1: Push local changes (as per PRD)
      await this.pushChanges(lastSyncedAt);

      // Step 2: Pull server changes
      await this.pullChanges(lastSyncedAt);

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  async forceSync(): Promise<void> {
    // Force sync by resetting last sync time
    await this.setLastSyncedAt(0);
    await this.sync();
  }
}

export default SyncService.getInstance();
