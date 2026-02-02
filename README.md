# NeedleAfrica

A comprehensive React Native application for managing tailoring business operations with offline-first capabilities.

## Overview

NeedleAfrica is a mobile application built for tailors and fashion designers to manage customers, measurements, and orders efficiently. The app features a robust offline-first architecture, allowing users to work seamlessly without internet connectivity while automatically syncing data when online.

## Key Features

### Core Functionality
- **Customer Management**: Add, edit, and manage customer profiles with contact information
- **Measurements**: Store and retrieve detailed body measurements for each customer
- **Order Tracking**: Create and manage tailoring orders with status tracking
- **Offline-First**: Full functionality without internet; automatic sync when connected

### Technical Features
- **Real-time Sync**: Automatic background synchronization every 30 seconds
- **Conflict Resolution**: Last-write-wins strategy with server priority
- **Soft Deletes**: Data integrity with recoverable deletions
- **Network Awareness**: Automatic sync when connection restored
- **Secure Authentication**: JWT-based auth with persistent sessions

## Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Database**: WatermelonDB (SQLite wrapper)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Context API
- **Network**: Axios with custom instance
- **Icons**: Lucide React Native

### Backend (API)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod schema validation
- **File Upload**: Multer for handling images

## Architecture

### Data Flow
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

### Sync Architecture
- **Pull Changes**: Fetch updates from server since last sync
- **Push Changes**: Send local changes to server
- **Conflict Resolution**: Timestamps determine winner (last-write-wins)
- **Soft Deletes**: Records marked as deleted, not removed

## Project Structure

```
needleafrica-app/
├── app/                        # Expo Router app directory
│   ├── (auth)/                 # Auth group routes
│   │   ├── _layout.tsx
│   │   ├── forgot-password.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/                 # Main app tabs
│   │   ├── customers/
│   │   ├── extras/
│   │   ├── orders/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── customers/              # Customer detail screens
│   ├── _layout.tsx             # Root layout
│   ├── loading.tsx             # Loading screen
│   └── +not-found.tsx
├── components/                 # Reusable components
│   ├── forms/
│   ├── layout/
│   ├── SyncStatusBar.tsx       # Sync indicator UI
│   └── ui/
├── constants/
│   └── currencies.ts
├── contexts/
│   └── AuthContext.tsx         # Authentication context
├── database/
│   ├── watermelon/
│   │   ├── index.ts            # DB initialization
│   │   ├── migrations.ts
│   │   ├── schema.ts           # Table schemas
│   │   ├── sync.ts             # Sync logic
│   │   └── models/             # Data models
│   │       ├── Customer.ts
│   │       ├── Measurement.ts
│   │       └── Order.ts
│   └── sqlite.ts
├── docs/
│   └── OFFLINE_SYNC.md         # Detailed sync documentation
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts
│   ├── useCustomers.ts         # Customer CRUD operations
│   ├── useNetworkSync.ts
│   └── useSync.ts              # Sync management hook
├── lib/
│   └── axios.ts                # Axios configuration
├── services/
│   └── SyncService.ts          # Legacy sync service
├── types/
│   └── sync.ts                 # Sync type definitions
├── app.json                    # Expo configuration
├── babel.config.js
├── global.css                  # Global styles
├── metro.config.js
├── nativewind-env.d.ts
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json

NAfrica-API/                    # Backend API (sibling directory)
├── prisma/
│   └── schema.prisma           # Database schema
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── sync.controller.ts  # Sync endpoints
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── sync.routes.ts
│   └── prisma.ts
├── package.json
└── ...
```

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- MongoDB instance (local or Atlas)

### Frontend Setup

1. **Clone and navigate to project**
   ```bash
   git clone https://github.com/Daniel001-odii/NeedleAfrica-Native.git
   cd NeedleAfrica-Native
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install additional required packages**
   ```bash
   npm install @react-native-async-storage/async-storage
   npm install @react-native-community/netinfo
   ```

4. **Environment setup**
   Create `.env` file:
   ```env
   EXPO_PUBLIC_API_URL=http://your-api-url.com/api
   ```

5. **Start the app**
   ```bash
   npx expo start
   ```

### Backend Setup

1. **Navigate to API directory**
   ```bash
   cd ../NAfrica-API
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   Create `.env` file:
   ```env
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database"
   JWT_SECRET="your-jwt-secret"
   PORT=3000
   ```

4. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

## Usage

### Authentication
- Sign up with email and password
- Login with existing credentials
- Automatic session persistence
- Secure token management

### Managing Customers
1. Tap "+" to add new customer
2. Enter name, phone, gender, and notes
3. Save (works offline)
4. Data syncs automatically when online

### Adding Measurements
1. Open customer profile
2. Tap "Add Measurement"
3. Enter measurement details
4. Save locally, syncs to server

### Creating Orders
1. From customer profile, tap "New Order"
2. Enter style name, amount, status, delivery date
3. Add any special notes
4. Track order status

### Manual Sync
The app syncs automatically every 30 seconds when online. To force sync:
- Use the Sync button in the UI
- Pull down to refresh (if implemented)
- Background/foreground app switch triggers sync

## Sync Status Indicators

| Status | Icon | Description |
|--------|------|-------------|
| Online | ● Online | Connected to server |
| Offline | ● Offline | Working locally |
| Syncing | ⟳ Syncing | Actively syncing |
| Error | ✕ Error | Sync failed, will retry |

## Data Models

### Customer
```typescript
{
  id: string;              // UUID
  server_id?: string;      // Server-side ID after sync
  full_name: string;
  phone_number?: string;
  gender?: string;
  notes?: string;
  sync_status: 'synced' | 'created' | 'updated' | 'deleted';
  deleted_at?: number;     // Soft delete timestamp
  created_at: number;
  updated_at: number;
}
```

### Measurement
```typescript
{
  id: string;
  server_id?: string;
  customer_id: string;     // Foreign key
  title: string;
  values_json: string;     // JSON string of measurements
  sync_status: string;
  deleted_at?: number;
  created_at: number;
  updated_at: number;
}
```

### Order
```typescript
{
  id: string;
  server_id?: string;
  customer_id: string;
  style_name: string;
  amount?: number;
  status: string;
  notes?: string;
  delivery_date?: number;
  sync_status: string;
  deleted_at?: number;
  created_at: number;
  updated_at: number;
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Sync
- `GET /api/sync?last_pulled_at={timestamp}` - Pull changes
- `POST /api/sync` - Push changes

## Development

### Adding a New Field

1. Update Prisma schema
2. Run `npx prisma generate`
3. Update WatermelonDB schema
4. Update frontend model
5. Update sync transformers
6. Bump schema version if breaking change

### Testing Sync

1. **Offline Creation**
   - Disable network
   - Create customer
   - Enable network
   - Verify sync

2. **Conflict Resolution**
   - Create on Device A, sync
   - Modify on Device B, sync
   - Modify on Device A, sync
   - Verify last-write-wins

3. **Soft Deletes**
   - Delete on one device
   - Sync
   - Pull on another device
   - Verify record removed locally

## Troubleshooting

### Common Issues

**AsyncStorage Error**
```bash
npm install @react-native-async-storage/async-storage
npx expo start --clear
```

**WatermelonDB Not Linked**
```bash
# For development builds
npx expo prebuild --clean
npx expo run:ios
```

**Sync Not Working**
- Check API URL in `.env`
- Verify auth token is valid
- Check server logs
- Verify schema matches between frontend/backend

### Debug Mode
Enable debug logging:
```typescript
// In sync.ts
console.log('Pull changes:', changes);
console.log('Push changes:', changes);
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [WatermelonDB](https://github.com/Nozbe/WatermelonDB) for the excellent offline-first database
- [Expo](https://expo.dev) for the React Native development platform
- [Prisma](https://prisma.io) for the ORM

## Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for African tailors and fashion designers.**
