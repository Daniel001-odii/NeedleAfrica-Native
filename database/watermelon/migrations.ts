import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
    migrations: [
        {
            toVersion: 2,
            steps: [
                addColumns({
                    table: 'customers',
                    columns: [
                        { name: 'user_id', type: 'string', isOptional: true },
                        { name: 'deleted_at', type: 'number', isOptional: true },
                    ],
                }),
                addColumns({
                    table: 'measurements',
                    columns: [
                        { name: 'user_id', type: 'string', isOptional: true },
                        { name: 'deleted_at', type: 'number', isOptional: true },
                    ],
                }),
                addColumns({
                    table: 'orders',
                    columns: [
                        { name: 'user_id', type: 'string', isOptional: true },
                        { name: 'deleted_at', type: 'number', isOptional: true },
                    ],
                }),
            ],
        },
        {
            toVersion: 3,
            steps: [
                addColumns({
                    table: 'orders',
                    columns: [
                        { name: 'fabric_image', type: 'string', isOptional: true },
                        { name: 'style_image', type: 'string', isOptional: true },
                    ],
                }),
            ],
        },
        {
            toVersion: 4,
            steps: [
                createTable({
                    name: 'measurement_templates',
                    columns: [
                        { name: 'server_id', type: 'string', isOptional: true },
                        { name: 'user_id', type: 'string', isOptional: true },
                        { name: 'name', type: 'string' },
                        { name: 'fields_json', type: 'string' },
                        { name: 'deleted_at', type: 'number', isOptional: true },
                        { name: 'sync_status', type: 'string' },
                        { name: 'created_at', type: 'number' },
                        { name: 'updated_at', type: 'number' },
                    ],
                }),
            ],
        },
    ],
});
