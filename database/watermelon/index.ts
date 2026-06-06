import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';

import schema from './schema';
import Customer from './models/Customer';
import Measurement from './models/Measurement';
import MeasurementTemplate from './models/MeasurementTemplate';
import Order from './models/Order';
import Invoice from './models/Invoice';

let databaseInstance: Database;

const modelClasses = [
    Customer,
    Measurement,
    MeasurementTemplate,
    Order,
    Invoice,
];

if (Platform.OS === 'web') {
    // 1. Web Fallback Strategy
    // Uses the built-in LokiJS adapter to give you a functioning local database in the browser
    const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
    
    const webAdapter = new LokiJSAdapter({
        schema,
        useWebWorker: false,
        useIncrementalIndexedDB: true,
    });

    databaseInstance = new Database({
        adapter: webAdapter,
        modelClasses,
    });
} else {
    // 2. Mobile Strategy (iOS / Android)
    // Using require ensures the SQLite files are never loaded or executed on the web
    const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
    const migrations = require('./migrations').default;

    const nativeAdapter = new SQLiteAdapter({
        schema,
        dbName: 'NeedleAfrica_v3',
        migrations,
        jsi: false,
        onSetUpError: (error: any) => {
            console.error("WatermelonDB Mobile Setup Error: ", error);
        }
    });

    databaseInstance = new Database({
        adapter: nativeAdapter,
        modelClasses,
    });
}

export const database = databaseInstance;