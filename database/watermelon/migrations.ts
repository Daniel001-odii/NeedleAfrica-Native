import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

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
    ],
});
