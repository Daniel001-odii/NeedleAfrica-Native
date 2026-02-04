import { Model, Relation } from '@nozbe/watermelondb';
import { field, text, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import * as Crypto from 'expo-crypto';
import Customer from './Customer';
import { Associations } from '@nozbe/watermelondb/Model';
import { SyncStatus } from '../../../types/sync';

const generateUUID = async () => {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
        .map((b, i) => (i === 4 ? '-' : '') + b.toString(16).padStart(2, '0'))
        .join('');
};

export default class Measurement extends Model {
    static table = 'measurements';
    static associations: Associations = {
        customers: { type: 'belongs_to', key: 'customer_id' },
    };

    @text('user_id') userId!: string;
    @text('customer_id') customerId!: string;
    @text('title') title!: string;
    @text('values_json') valuesJson!: string;
    @field('deleted_at') deletedAt!: number | null;
    @text('sync_status') _syncStatus!: string;

    @date('created_at') createdAt!: Date;
    @date('updated_at') updatedAt!: Date;

    @relation('customers', 'customer_id') customer!: Relation<Customer>;

    get syncStatus(): SyncStatus {
        return this._syncStatus as SyncStatus;
    }

    set syncStatus(value: SyncStatus) {
        this._syncStatus = value;
    }

    static async createSyncable(database: any, userId: string, customerId: string, data: any) {
        const now = Date.now();
        return await database.write(async () => {
            return await database.get('measurements').create((record: any) => {
                record.userId = userId;
                record.customerId = customerId;
                record.title = data.title;
                record.valuesJson = data.valuesJson;
                record.deletedAt = null;
                record.syncStatus = 'created';
                record.createdAt = new Date(now);
                record.updatedAt = new Date(now);
            });
        });
    }

    async markForSync() {
        await this.database.write(async () => {
            await this.update((record: any) => {
                record.syncStatus = 'created';
                record.updatedAt = new Date();
            });
        });
    }

    async softDelete() {
        await this.database.write(async () => {
            await this.markAsDeleted();
        });
    }
}
