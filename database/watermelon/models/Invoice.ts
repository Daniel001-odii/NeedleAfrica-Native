import { Model, Relation } from '@nozbe/watermelondb';
import { field, text, date, relation } from '@nozbe/watermelondb/decorators';
import Customer from './Customer';
import Order from './Order';
import { Associations } from '@nozbe/watermelondb/Model';
import { SyncStatus } from '../../../types/sync';

export default class Invoice extends Model {
    static table = 'invoices';
    static associations: Associations = {
        customers: { type: 'belongs_to', key: 'customer_id' },
        orders: { type: 'belongs_to', key: 'order_id' },
    };

    @text('user_id') userId?: string;
    @text('customer_id') customerId?: string;
    @text('order_id') orderId?: string;
    @text('invoice_number') invoiceNumber?: string;
    @field('amount') amount?: number;
    @text('currency') currency?: string;
    @text('notes') notes?: string | null;
    @field('deleted_at') deletedAt?: number | null;
    @text('sync_status') _syncStatus?: string;

    @date('created_at') createdAt?: Date;
    @date('updated_at') updatedAt?: Date;

    @relation('customers', 'customer_id') customer?: Relation<Customer>;
    @relation('orders', 'order_id') order?: Relation<Order>;

    get syncStatus(): SyncStatus {
        return this._syncStatus as SyncStatus;
    }

    set syncStatus(value: SyncStatus) {
        this._syncStatus = value;
    }

    static async createSyncable(database: any, userId: string, data: {
        customerId: string;
        orderId: string;
        invoiceNumber: string;
        amount: number;
        currency: string;
        notes?: string;
    }) {
        const now = Date.now();
        return await database.write(async () => {
            return await database.get('invoices').create((record: any) => {
                record.userId = userId;
                record.customerId = data.customerId;
                record.orderId = data.orderId;
                record.invoiceNumber = data.invoiceNumber;
                record.amount = data.amount;
                record.currency = data.currency;
                record.notes = data.notes || null;
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
