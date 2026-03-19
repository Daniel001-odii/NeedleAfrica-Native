import { Model, Query } from '@nozbe/watermelondb';
import { field, text, readonly, date, children } from '@nozbe/watermelondb/decorators';
import * as Crypto from 'expo-crypto';
import Measurement from './Measurement';
import Order from './Order';
import { Associations } from '@nozbe/watermelondb/Model';
import { SyncStatus } from '../../../types/sync';

const generateUUID = async () => {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
        .map((b, i) => (i === 4 ? '-' : '') + b.toString(16).padStart(2, '0'))
        .join('');
};

export default class Customer extends Model {
    static table = 'customers';
    static associations: Associations = {
        measurements: { type: 'has_many', foreignKey: 'customer_id' },
        orders: { type: 'has_many', foreignKey: 'customer_id' },
    };

    @text('server_id') serverId?: string;
    @text('user_id') userId?: string;
    @text('full_name') fullName?: string;
    @text('phone_number') phoneNumber?: string | null;
    @text('gender') gender?: string | null;
    @text('notes') notes?: string | null;
    @field('deleted_at') deletedAt?: number | null;

    @readonly @date('created_at') createdAt!: Date;
    @readonly @date('updated_at') updatedAt!: Date;

    @children('measurements') measurements!: Query<Measurement>;
    @children('orders') orders!: Query<Order>;

    static async createSyncable(database: any, userId: string, data: Partial<Customer>) {
        return await database.write(async () => {
            return await database.get('customers').create((record: any) => {
                record.userId = userId;
                record.fullName = data.fullName;
                record.phoneNumber = data.phoneNumber || null;
                record.gender = data.gender || null;
                record.notes = data.notes || null;
            });
        });
    }

    async softDelete() {
        await this.database.write(async () => {
            await this.update(record => {
                record.deletedAt = Date.now();
            });
            await this.markAsDeleted(); // Watermelon internal delete flag
        });
    }
}
