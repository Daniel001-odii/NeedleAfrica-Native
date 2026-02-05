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

export default class Order extends Model {
    static table = 'orders';
    static associations: Associations = {
        customers: { type: 'belongs_to', key: 'customer_id' },
    };

    @text('user_id') userId!: string;
    @text('customer_id') customerId!: string;
    @text('style_name') styleName!: string;
    @date('delivery_date') deliveryDate!: Date | null;
    @text('status') status!: string;
    @field('amount') amount!: number | null;
    @text('notes') notes!: string | null;
    @text('fabric_image') fabricImage!: string | null;
    @text('style_image') styleImage!: string | null;
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
            return await database.get('orders').create((record: any) => {
                record.userId = userId;
                record.customerId = customerId;
                record.styleName = data.styleName;
                record.deliveryDate = data.deliveryDate || null;
                record.status = data.status || 'PENDING';
                record.amount = data.amount || null;
                record.notes = data.notes || null;
                record.fabricImage = data.fabricImage || null;
                record.styleImage = data.styleImage || null;
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
