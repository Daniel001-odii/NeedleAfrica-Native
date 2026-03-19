import { Model, Relation } from '@nozbe/watermelondb';
import { field, text, date, relation, readonly } from '@nozbe/watermelondb/decorators';
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

    @text('server_id') serverId?: string;
    @text('user_id') userId?: string;
    @text('customer_id') customerId?: string;
    @text('order_id') orderId?: string;
    @text('invoice_number') invoiceNumber?: string;
    @field('amount') amount?: number;
    @text('currency') currency?: string;
    @text('notes') notes?: string | null;
    @field('deleted_at') deletedAt?: number | null;

    @readonly @date('created_at') createdAt!: Date;
    @readonly @date('updated_at') updatedAt!: Date;

    @relation('customers', 'customer_id') customer!: Relation<Customer>;
    @relation('orders', 'order_id') order!: Relation<Order>;

    static async createSyncable(database: any, userId: string, data: {
        customerId: string;
        orderId: string;
        invoiceNumber: string;
        amount: number;
        currency: string;
        notes?: string;
    }) {
        return await database.write(async () => {
            return await database.get('invoices').create((record: any) => {
                record.userId = userId;
                record.customerId = data.customerId;
                record.orderId = data.orderId;
                record.invoiceNumber = data.invoiceNumber;
                record.amount = data.amount;
                record.currency = data.currency || 'NGN';
                record.notes = data.notes || null;
            });
        });
    }

    async softDelete() {
        await this.database.write(async () => {
            await this.update(record => {
                record.deletedAt = Date.now();
            });
            await this.markAsDeleted();
        });
    }
}
