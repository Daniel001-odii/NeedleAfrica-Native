import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export default class MeasurementTemplate extends Model {
    static table = 'measurement_templates';

    @text('server_id') server_id?: string;
    @text('user_id') user_id?: string;
    @text('name') name?: string;
    @text('fields_json') fields_json?: string;
    @date('deleted_at') deleted_at?: number;
    @text('sync_status') sync_status?: string;
    @readonly @date('created_at') created_at?: number;
    @readonly @date('updated_at') updated_at?: number;

    get fields() {
        try {
            return JSON.parse(this.fields_json || '[]');
        } catch {
            return [];
        }
    }
}
