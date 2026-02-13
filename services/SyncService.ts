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
  measurement_templates: {
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
      measurement_templates: { created: [], updated: [], deleted: [] },
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
          user_id: record.userId,
          full_name: record.fullName,
          phone_number: record.phoneNumber,
          gender: record.gender,
          notes: record.notes,
          created_at: record.createdAt.getTime(),
          updated_at: record.updatedAt.getTime(),
          deleted_at: record.deletedAt,
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
          user_id: record.userId,
          customer_id: record.customerId,
          title: record.title,
          values_json: record.valuesJson,
          created_at: record.createdAt.getTime(),
          updated_at: record.updatedAt.getTime(),
          deleted_at: record.deletedAt,
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
          user_id: record.userId,
          customer_id: record.customerId,
          style_name: record.styleName,
          delivery_date: record.deliveryDate ? record.deliveryDate.getTime() : null,
          status: record.status,
          amount: record.amount,
          amount_paid: record.amountPaid,
          notes: record.notes,
          created_at: record.createdAt.getTime(),
          updated_at: record.updatedAt.getTime(),
          deleted_at: record.deletedAt,
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

      // Get pending measurement templates
      const pendingTemplates = await database
        .get('measurement_templates')
        .query(Q.where('sync_status', 'created'))
        .fetch();

      const deletedTemplates = await database
        .get('measurement_templates')
        .query(Q.where('deleted_at', Q.notEq(null)))
        .fetch();

      const allTemplates = [...pendingTemplates, ...deletedTemplates];

      for (const template of allTemplates) {
        const record = template as any;
        const templateData = {
          id: record.id,
          user_id: record.userId,
          name: record.name,
          fields_json: record.fieldsJson,
          created_at: record.createdAt.getTime(),
          updated_at: record.updatedAt.getTime(),
          deleted_at: record.deletedAt,
        };

        if (record.deletedAt) {
          changes.measurement_templates.deleted.push({
            id: record.id,
            deletedAt: record.deletedAt,
          });
        } else if (record.syncStatus === 'created') {
          changes.measurement_templates.created.push(templateData);
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
      changes.orders.deleted.length > 0 ||
      changes.measurement_templates.created.length > 0 ||
      changes.measurement_templates.deleted.length > 0;

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
            if (customer.updated_at > existingTime) {
              await existingRecord.update((record: any) => {
                record.fullName = customer.full_name;
                record.phoneNumber = customer.phone_number;
                record.gender = customer.gender;
                record.notes = customer.notes;
                record.deletedAt = customer.deleted_at;
                record.syncStatus = 'synced';
                record.updatedAt = new Date(customer.updated_at);
              });
            }
          } else if (!customer.deleted_at) {
            // Create new record if not deleted
            await database.get('customers').create((record: any) => {
              record.id = customer.id;
              record.userId = customer.user_id;
              record.fullName = customer.full_name;
              record.phoneNumber = customer.phone_number;
              record.gender = customer.gender;
              record.notes = customer.notes;
              record.deletedAt = customer.deleted_at;
              record.syncStatus = 'synced';
              record.createdAt = new Date(customer.created_at);
              record.updatedAt = new Date(customer.updated_at);
            });
          }
        }

        // Apply measurement changes
        for (const measurement of changes.measurements.created) {
          const existingRecord = await database.get('measurements').find(measurement.id).catch(() => null);

          if (existingRecord) {
            const existingTime = (existingRecord as any).updatedAt.getTime();
            if (measurement.updated_at > existingTime) {
              await existingRecord.update((record: any) => {
                record.customerId = measurement.customer_id;
                record.title = measurement.title;
                record.valuesJson = measurement.values_json;
                record.deletedAt = measurement.deleted_at;
                record.syncStatus = 'synced';
                record.updatedAt = new Date(measurement.updated_at);
              });
            }
          } else if (!measurement.deleted_at) {
            await database.get('measurements').create((record: any) => {
              record.id = measurement.id;
              record.userId = measurement.user_id;
              record.customerId = measurement.customer_id;
              record.title = measurement.title;
              record.valuesJson = measurement.values_json;
              record.deletedAt = measurement.deleted_at;
              record.syncStatus = 'synced';
              record.createdAt = new Date(measurement.created_at);
              record.updatedAt = new Date(measurement.updated_at);
            });
          }
        }

        // Apply order changes
        for (const order of changes.orders.created) {
          const existingRecord = await database.get('orders').find(order.id).catch(() => null);

          if (existingRecord) {
            const existingTime = (existingRecord as any).updatedAt.getTime();
            if (order.updated_at > existingTime) {
              await existingRecord.update((record: any) => {
                record.customerId = order.customer_id;
                record.styleName = order.style_name;
                record.deliveryDate = order.delivery_date ? new Date(order.delivery_date) : null;
                record.status = order.status;
                record.amount = order.amount;
                record.amountPaid = order.amount_paid;
                record.notes = order.notes;
                record.deletedAt = order.deleted_at;
                record.syncStatus = 'synced';
                record.updatedAt = new Date(order.updated_at);
              });
            }
          } else if (!order.deleted_at) {
            await database.get('orders').create((record: any) => {
              record.id = order.id;
              record.userId = order.user_id;
              record.customerId = order.customer_id;
              record.styleName = order.style_name;
              record.deliveryDate = order.delivery_date ? new Date(order.delivery_date) : null;
              record.status = order.status;
              record.amount = order.amount;
              record.amountPaid = order.amount_paid;
              record.notes = order.notes;
              record.deletedAt = order.deleted_at;
              record.syncStatus = 'synced';
              record.createdAt = new Date(order.created_at);
              record.updatedAt = new Date(order.updated_at);
            });
          }
        }

        // Apply template changes
        if (changes.measurement_templates) {
          for (const template of changes.measurement_templates.created) {
            const existingRecord = await database.get('measurement_templates').find(template.id).catch(() => null);

            if (existingRecord) {
              const existingTime = (existingRecord as any).updatedAt.getTime();
              if (template.updated_at > existingTime) {
                await existingRecord.update((record: any) => {
                  record.name = template.name;
                  record.fieldsJson = template.fields_json;
                  record.deletedAt = template.deleted_at;
                  record.syncStatus = 'synced';
                  record.updatedAt = new Date(template.updated_at);
                });
              }
            } else if (!template.deleted_at) {
              await database.get('measurement_templates').create((record: any) => {
                record.id = template.id;
                record.userId = template.user_id;
                record.name = template.name;
                record.fieldsJson = template.fields_json;
                record.deletedAt = template.deleted_at;
                record.syncStatus = 'synced';
                record.createdAt = new Date(template.created_at);
                record.updatedAt = new Date(template.updated_at);
              });
            }
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
