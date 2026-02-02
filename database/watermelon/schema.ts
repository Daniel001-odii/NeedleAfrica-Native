import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
    version: 2,
    tables: [
        tableSchema({
            name: 'customers',
            columns: [
                { name: 'server_id', type: 'string', isOptional: true },
                { name: 'user_id', type: 'string', isOptional: true },
                { name: 'full_name', type: 'string' },
                { name: 'phone_number', type: 'string', isOptional: true },
                { name: 'gender', type: 'string', isOptional: true },
                { name: 'notes', type: 'string', isOptional: true },
                { name: 'deleted_at', type: 'number', isOptional: true },
                { name: 'sync_status', type: 'string' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'measurements',
            columns: [
                { name: 'server_id', type: 'string', isOptional: true },
                { name: 'user_id', type: 'string', isOptional: true },
                { name: 'customer_id', type: 'string', isIndexed: true },
                { name: 'title', type: 'string' },
                { name: 'values_json', type: 'string' },
                { name: 'deleted_at', type: 'number', isOptional: true },
                { name: 'sync_status', type: 'string' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'orders',
            columns: [
                { name: 'server_id', type: 'string', isOptional: true },
                { name: 'user_id', type: 'string', isOptional: true },
                { name: 'customer_id', type: 'string', isIndexed: true },
                { name: 'style_name', type: 'string' },
                { name: 'delivery_date', type: 'number', isOptional: true },
                { name: 'status', type: 'string' },
                { name: 'amount', type: 'number', isOptional: true },
                { name: 'notes', type: 'string', isOptional: true },
                { name: 'deleted_at', type: 'number', isOptional: true },
                { name: 'sync_status', type: 'string' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
    ],
});
