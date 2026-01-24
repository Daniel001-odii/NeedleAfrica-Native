import * as SQLite from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
    const DATABASE_VERSION = 1;
    let { user_version: currentDbVersion } = await db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version'
    );

    if (currentDbVersion >= DATABASE_VERSION) {
        return;
    }

    if (currentDbVersion === 0) {
        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE customers (
                id TEXT PRIMARY KEY NOT NULL,
                server_id TEXT,
                full_name TEXT NOT NULL,
                phone_number TEXT,
                gender TEXT,
                notes TEXT,
                is_synced INTEGER DEFAULT 0,
                created_at INTEGER,
                updated_at INTEGER
            );
            CREATE TABLE measurements (
                id TEXT PRIMARY KEY NOT NULL,
                server_id TEXT,
                customer_id TEXT NOT NULL,
                title TEXT NOT NULL,
                values_json TEXT NOT NULL,
                is_synced INTEGER DEFAULT 0,
                created_at INTEGER,
                updated_at INTEGER,
                FOREIGN KEY (customer_id) REFERENCES customers (id)
            );
            CREATE TABLE orders (
                id TEXT PRIMARY KEY NOT NULL,
                server_id TEXT,
                customer_id TEXT NOT NULL,
                style_name TEXT NOT NULL,
                delivery_date INTEGER,
                status TEXT NOT NULL,
                amount REAL,
                notes TEXT,
                is_synced INTEGER DEFAULT 0,
                created_at INTEGER,
                updated_at INTEGER,
                FOREIGN KEY (customer_id) REFERENCES customers (id)
            );
        `);
        await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    }
}
