import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import migrations from './migrations'; // We'll create an empty migrations file
import Customer from './models/Customer';
import Measurement from './models/Measurement';
import MeasurementTemplate from './models/MeasurementTemplate';
import Order from './models/Order';

const adapter = new SQLiteAdapter({
    schema,
    // (Optional) Database name
    dbName: 'NeedleAfrica_v3',
    // (Optional) Migrations
    migrations,
    // (Optional) Synchronous mode (experimental)
    // Set jsi to false if you are testing in Expo Go or having trouble with Dev Builds
    jsi: false,
    // (Optional) What to do if the database is broken
    onSetUpError: error => {
        // Database failed to load -- display an error message or see why it failed
    }
});

export const database = new Database({
    adapter,
    modelClasses: [
        Customer,
        Measurement,
        MeasurementTemplate,
        Order,
    ],
});
