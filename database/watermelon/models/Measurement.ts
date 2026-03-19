import { Model, Relation } from '@nozbe/watermelondb';
import { field, text, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import Customer from './Customer';
import { Associations } from '@nozbe/watermelondb/Model';

export default class Measurement extends Model {
    static table = 'measurements';
    static associations: Associations = {
        customers: { type: 'belongs_to', key: 'customer_id' },
    };

    @text('server_id') serverId?: string;
    @text('user_id') userId?: string;
    @text('customer_id') customerId?: string;
    @text('title') title?: string;
    @text('values_json') valuesJson?: string;
    @field('deleted_at') deletedAt?: number | null;

    @readonly @date('created_at') createdAt!: Date;
    @readonly @date('updated_at') updatedAt!: Date;

    @relation('customers', 'customer_id') customer!: Relation<Customer>;

    get values() {
        try {
            return JSON.parse(this.valuesJson || '{}');
        } catch {
            return {};
        }
    }

    static async createSyncable(database: any, userId: string, customerId: string, data: {
        title: string;
        values: any;
    }) {
        return await database.write(async () => {
            return await database.get('measurements').create((record: any) => {
                record.userId = userId;
                record.customerId = customerId;
                record.title = data.title;
                record.valuesJson = JSON.stringify(data.values || {});
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
