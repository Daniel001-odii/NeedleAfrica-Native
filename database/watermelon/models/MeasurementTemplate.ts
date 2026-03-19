import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export default class MeasurementTemplate extends Model {
    static table = 'measurement_templates';

    @text('server_id') serverId?: string;
    @text('user_id') userId?: string;
    @text('name') name?: string;
    @text('fields_json') fieldsJson?: string;
    @field('deleted_at') deletedAt?: number | null;

    @readonly @date('created_at') createdAt!: Date;
    @readonly @date('updated_at') updatedAt!: Date;

    get fields() {
        try {
            return JSON.parse(this.fieldsJson || '[]');
        } catch {
            return [];
        }
    }

    static async createSyncable(database: any, userId: string, data: {
        name: string;
        fields: any[];
    }) {
        return await database.write(async () => {
            return await database.get('measurement_templates').create((record: any) => {
                record.userId = userId;
                record.name = data.name;
                record.fieldsJson = JSON.stringify(data.fields || []);
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
