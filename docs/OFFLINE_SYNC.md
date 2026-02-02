# Offline-First Sync Implementation

This document describes the complete offline-first synchronization system implemented for NeedleAfrica.

## Architecture Overview

### Components

1. **Frontend (React Native + WatermelonDB)**
   - Local SQLite database with WatermelonDB ORM
   - Sync service with network awareness
   - Optimistic UI updates
   - Conflict resolution

2. **Backend (Node.js + Express + Prisma + MongoDB)**
   - RESTful sync endpoints
   - Soft delete support
   - Last-write-wins conflict resolution
   - User-scoped data

## Data Flow

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  React Native   │────▶│  Watermelon  │────▶│   SQLite DB     │
│     Client      │◀────│     DB       │◀────│  (Local Cache)  │
└─────────────────┘     └──────────────┘     └─────────────────┘
         │                                               │
         │ Sync (Pull/Push)                              │ CRUD
         ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│   Express API   │──────────────────────────▶│   Prisma ORM    │
│   (/sync)       │                           │   (MongoDB)     │
└─────────────────┘                           └─────────────────┘
```

## Models

### Customer
- id (string - UUID)
- server_id (string - optional, set after sync)
- full_name (string)
- phone_number (string, optional)
- gender (string, optional)
- notes (string, optional)
- sync_status ('synced' | 'created' | 'updated' | 'deleted')
- deleted_at (number, optional - timestamp for soft delete)
- created_at (number)
- updated_at (number)

### Measurement
- id (string - UUID)
- server_id (string - optional)
- customer_id (string - foreign key)
- title (string)
- values_json (string - JSON string of measurements)
- sync_status
- deleted_at (optional)
- created_at
- updated_at

### Order
- id (string - UUID)
- server_id (string - optional)
- customer_id (string - foreign key)
- style_name (string)
- amount (number, optional)
- status (string)
- notes (string, optional)
- delivery_date (number, optional)
- sync_status
- deleted_at (optional)
- created_at
- updated_at

## API Endpoints

### GET /sync
Pull changes from server since last sync.

**Query Parameters:**
- `last_pulled_at`: Timestamp of last sync (milliseconds)
- `schema_version`: Database schema version

**Response:**
```json
{
  "changes": {
    "customers": {
      "created": [...],
      "updated": [...],
      "deleted": [{ "id": "...", "deleted_at": 1234567890 }]
    },
    "measurements": { ... },
    "orders": { ... }
  },
  "timestamp": 1234567890
}
```

### POST /sync
Push local changes to server.

**Request Body:**
```json
{
  "changes": {
    "customers": {
      "created": [...],
      "updated": [...],
      "deleted": [{ "id": "...", "deleted_at": 1234567890 }]
    },
    ...
  },
  "last_pulled_at": 1234567890
}
```

## Frontend Implementation

### 1. Database Schema

Located in `database/watermelon/schema.ts`:
- Uses `sync_status` field (string) to track sync state
- Supports soft deletes via `deleted_at` field

### 2. Models

Located in `database/watermelon/models/`:
- Customer.ts
- Measurement.ts
- Order.ts

All models extend WatermelonDB's `Model` class and implement:
- `syncStatus` getter/setter using WatermelonDB's SyncStatus type
- `createSyncable()` static method for creating records
- Soft delete support

### 3. Sync Function

Located in `database/watermelon/sync.ts`:

```typescript
import { sync } from './database/watermelon/sync';

// Perform sync
await sync();
```

Features:
- Automatic data transformation between frontend/backend formats
- Handles created, updated, and deleted records
- Error handling and retry logic
- Network awareness

### 4. useSync Hook

Located in `hooks/useSync.ts`:

```typescript
import { useSync } from './hooks/useSync';

function MyComponent() {
  const { sync, isSyncing, lastSyncedAt, isOnline } = useSync();
  
  return (
    <Button 
      onPress={sync} 
      disabled={isSyncing || !isOnline}
    >
      Sync Now
    </Button>
  );
}
```

Features:
- Network status monitoring
- Automatic sync when coming online
- Sync state tracking
- Error handling

### 5. CRUD Hooks

Located in `hooks/useCustomers.ts`:

```typescript
const { 
  customers, 
  loading, 
  addCustomer, 
  updateCustomer, 
  deleteCustomer 
} = useCustomers(searchQuery);
```

All CRUD operations:
- Work offline (immediate local updates)
- Set sync_status to 'created' for new records
- Mark records for sync on update
- Use soft deletes

## Backend Implementation

### 1. Prisma Schema

Located in `NAfrica-API/prisma/schema.prisma`:

All models include:
- `deletedAt DateTime?` for soft deletes
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 2. Sync Controller

Located in `NAfrica-API/src/controllers/sync.controller.ts`:

Functions:
- `pullChanges`: Returns changes since last_pulled_at
- `pushChanges`: Applies client changes to server

Features:
- User-scoped data (userId filter)
- Soft delete handling
- Upsert for conflict resolution
- Timestamps in milliseconds

### 3. Routes

Located in `NAfrica-API/src/routes/sync.routes.ts`:

```typescript
router.get('/', authMiddleware, pullChanges);
router.post('/', authMiddleware, pushChanges);
```

## Conflict Resolution Strategy

We use **Last-Write-Wins** with server priority:

1. When pulling: Server data overwrites local if server timestamp > local timestamp
2. When pushing: Client changes are applied with upsert (create if not exists, update if exists)
3. Deleted records: Soft deleted on both sides, permanently removed after sync

## Sync Status Values

WatermelonDB uses these sync statuses:
- `'synced'` - Record is in sync with server
- `'created'` - New record, needs to be pushed
- `'updated'` - Modified record, needs to be pushed
- `'deleted'` - Marked for deletion
- `'disposable'` - Temporary record (not persisted)

## Best Practices

### 1. Creating Records

Always use the model's create method with sync_status:

```typescript
await database.get('customers').create(record => {
  record.fullName = data.fullName;
  record.syncStatus = 'created'; // Important!
});
```

### 2. Updating Records

Update sync_status when modifying:

```typescript
await customer.update(record => {
  record.fullName = newName;
  record.syncStatus = 'created'; // Mark for sync
});
```

### 3. Deleting Records

Use soft delete:

```typescript
// Option 1: Using model method
await customer.softDelete();

// Option 2: Manual soft delete
await customer.update(record => {
  record.deletedAt = Date.now();
  record.syncStatus = 'created';
});
```

### 4. Sync Timing

- Sync on app startup (if online)
- Sync when coming back online
- Sync after important operations
- Don't sync on every change (batch changes)

## Error Handling

### Frontend
- Network errors: Queue for retry
- Server errors: Log and notify user
- Conflict errors: Automatic resolution

### Backend
- Validation errors: Return 400 with details
- Auth errors: Return 401
- Server errors: Return 500, log details

## Testing Sync

### Manual Testing Steps:

1. **Create offline:**
   - Turn off network
   - Create customer
   - Verify sync_status = 'created'
   - Turn on network
   - Sync
   - Verify on server

2. **Update conflict:**
   - Create record on device A
   - Sync
   - Modify on device B and sync
   - Modify on device A and sync
   - Verify last-write-wins

3. **Delete sync:**
   - Create and sync record
   - Delete on device
   - Sync
   - Verify soft delete on server
   - Pull on other device
   - Verify deleted locally

## Migration Guide

### Adding a New Field:

1. Update Prisma schema
2. Run `prisma generate`
3. Update WatermelonDB schema
4. Update frontend model
5. Update sync transformers
6. Bump schema version

### Schema Version:

Increment `migrationsEnabledAtVersion` in sync.ts when making breaking changes.

## Troubleshooting

### Common Issues:

1. **Sync not working:**
   - Check network connectivity
   - Verify auth token
   - Check server logs
   - Verify schema matches

2. **Data not appearing:**
   - Check userId scoping
   - Verify soft delete filters
   - Check timestamp formats

3. **Conflicts not resolving:**
   - Ensure timestamps are correct
   - Check updated_at is being set
   - Verify upsert logic

## Performance Considerations

1. **Batch Size:** WatermelonDB handles batching automatically
2. **Sync Frequency:** Don't sync on every change
3. **Pagination:** Not needed for WatermelonDB sync
4. **Images:** Store URLs, not binary data
5. **Large Data:** Consider lazy loading

## Security

1. **Authentication:** All sync endpoints require valid JWT
2. **Authorization:** Data scoped to userId
3. **Validation:** All inputs validated with Zod
4. **Sanitization:** No SQL injection (Prisma handles this)

## Future Enhancements

1. **Delta Sync:** Only sync changed fields
2. **Compression:** Compress payload for large datasets
3. **Background Sync:** Sync when app is backgrounded
4. **Selective Sync:** Allow users to choose what syncs
5. **Conflict UI:** Manual conflict resolution option
