# 📋 FakeNotes - Offline-First Notes App with Supabase Sync

## 🧠 Overview

A React Native notes application with **full offline functionality** and **automatic cloud synchronization** using Supabase. The app allows users to create, edit, and delete notes seamlessly, whether online or offline. All changes are automatically synced when connectivity is restored.

### Key Features:
- ✅ **Offline-First Architecture** - Works completely offline using AsyncStorage
- ✅ **Automatic Sync** - Seamlessly syncs with Supabase when online
- ✅ **Real-time Network Detection** - Monitors connectivity status
- ✅ **Auto-save** - Notes are saved automatically as you type
- ✅ **Auto-copy to Clipboard** - Content automatically copied to clipboard (optional)
- ✅ **Conflict Resolution** - Smart merging of local and server changes
- ✅ **Visual Sync Indicators** - See which notes are synced or pending

---

## ⚙️ Technical Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile framework |
| **Supabase** | Backend-as-a-Service (Database, Auth, Real-time) |
| **AsyncStorage** | Local persistent storage for offline functionality |
| **React Navigation** | Screen navigation and routing |
| **@react-native-clipboard/clipboard** | Clipboard operations |
| **react-native-safe-area-context** | Safe area handling for different devices |

---

## 🧩 App Features

### Core Features
- 📝 **Create Notes** - Add new notes with title and content
- ✏️ **Edit Notes** - Update existing notes with auto-save
- 🗑️ **Delete Notes** - Soft delete notes (marked as deleted)
- 📋 **Auto-copy to Clipboard** - Automatically copy note content (with permission)
- 🔄 **Automatic Sync** - Sync changes when connection is restored
- 📡 **Network Status** - Real-time online/offline indicator
- 🔔 **Sync Status Indicators** - Visual badges showing sync status
- 👤 **User Authentication** - Login/Signup with Supabase Auth
- 👥 **Admin Features** - View other users' notes (admin only)

### Offline Features
- 💾 **Local Storage** - All notes stored locally using AsyncStorage
- 🔄 **Sync Queue** - Pending operations queued for sync
- ⚡ **Instant Access** - All notes available instantly, even offline
- 🔀 **Conflict Resolution** - Smart merging based on timestamps
- 📊 **Sync Status Tracking** - Track which notes are synced

---

## 🏗️ Project Structure

```
FakeNotes/
├── src/
│   ├── screens/
│   │   ├── NotesListScreen.js      # Main notes list with sync status
│   │   ├── NoteEditorScreen.js     # Create/edit notes with auto-save
│   │   ├── LoginScreen.js          # User authentication
│   │   ├── SignUpScreen.js         # User registration
│   │   ├── ProfileScreen.js        # User profile and settings
│   │   └── UserNotesScreen.js      # Admin view of user notes
│   ├── components/
│   │   └── NoteCard.js             # Note card component with sync indicators
│   ├── database/
│   │   └── db.js                   # Database operations (offline-first with sync)
│   ├── utils/
│   │   ├── offlineStorage.js       # AsyncStorage operations
│   │   ├── networkDetection.js     # Network connectivity monitoring
│   │   └── clipboardPermission.js # Clipboard permission management
│   ├── supabase.js                 # Supabase client configuration
│   └── App.tsx                     # Main app component with navigation
├── package.json
└── README.md
```

---

## 📁 Code Structure Explanation

### 1. **Database Layer** (`src/database/db.js`)

The core database module implementing **offline-first architecture**:

**Key Functions:**
- `initDB()` - Initializes database and network detection, performs initial sync
- `getNotes()` - Retrieves notes (local-first, syncs if online)
- `saveNote()` - Creates new note (saves locally, syncs if online)
- `updateNote()` - Updates note content (local-first, syncs if online)
- `updateNoteTitle()` - Updates note title (local-first, syncs if online)
- `deleteNote()` - Soft deletes note (local-first, syncs if online)
- `syncLocalChanges()` - Syncs all local changes to server
- `syncFromServer()` - Syncs server changes to local
- `manualSync()` - Manual sync trigger for user

**Architecture Pattern:**
```javascript
// Offline-First Pattern
1. Save to local storage (AsyncStorage) immediately
2. If online → sync to Supabase
3. If offline → queue for later sync
4. On reconnect → automatically sync queued changes
```

### 2. **Offline Storage** (`src/utils/offlineStorage.js`)

Manages local data persistence using AsyncStorage:

**Key Functions:**
- `getLocalNotes()` - Retrieve all notes from AsyncStorage
- `saveLocalNote()` - Save/update note in AsyncStorage
- `deleteLocalNote()` - Soft delete note locally
- `getSyncQueue()` - Get pending sync operations
- `addToSyncQueue()` - Add operation to sync queue
- `markNoteAsSynced()` - Mark note as successfully synced
- `isLocalId()` - Check if ID is a local (unsynced) ID

**Storage Keys:**
- `@notes_data` - All notes data
- `@sync_queue` - Pending sync operations
- `@last_sync` - Last sync timestamp

### 3. **Network Detection** (`src/utils/networkDetection.js`)

Monitors network connectivity status:

**Key Functions:**
- `initNetworkDetection()` - Initialize network monitoring
- `isOnlineNow()` - Check current online status (with caching)
- `subscribeToNetworkChanges()` - Subscribe to network state changes
- `getNetworkState()` - Get detailed network state

**How it Works:**
- Periodically checks connectivity by attempting Supabase queries
- Distinguishes between network errors and other errors
- Notifies listeners when connectivity changes
- Caches status to avoid excessive checks

### 4. **Screens**

#### **NotesListScreen** (`src/screens/NotesListScreen.js`)
- Displays all notes in a scrollable list
- Shows sync status bar (offline indicator, pending sync count)
- Manual sync button
- Auto-refreshes when screen comes into focus
- Handles clipboard permission modal

#### **NoteEditorScreen** (`src/screens/NoteEditorScreen.js`)
- Create/edit notes with title and content fields
- Auto-saves after 1 second of inactivity
- Auto-copies to clipboard (if permission granted)
- Saves changes before navigation
- Delete functionality for existing notes

#### **LoginScreen / SignUpScreen**
- User authentication with Supabase
- Email/password login and registration

#### **ProfileScreen**
- User profile information
- Admin features (if applicable)

#### **UserNotesScreen**
- Admin view of specific user's notes
- Read-only mode for viewing

### 5. **Components**

#### **NoteCard** (`src/components/NoteCard.js`)
- Displays note title, content preview, and timestamp
- Shows sync status badges:
  - 📤 - New note (not yet synced)
  - 🔄 - Updated note (pending sync)
  - DELETED badge for deleted notes

---

## 🗄️ Database Structure

### Supabase Table: `notes_data`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (Primary Key) | Unique note identifier |
| `title` | TEXT | Note title |
| `content` | TEXT | Note content/body |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `deleted_at` | TIMESTAMP (nullable) | Soft delete timestamp |
| `user_id` | UUID (nullable) | Owner user ID (for multi-user) |

### Local Storage Structure (AsyncStorage)

Notes are stored as JSON array:
```json
[
  {
    "id": "local_1234567890_abc" or 42,
    "title": "Note Title",
    "content": "Note content...",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "deleted_at": null,
    "synced": false
  }
]
```

**Note Properties:**
- `id`: Can be `local_*` (temporary) or server ID (permanent)
- `synced`: Boolean indicating if note is synced with server
- `deleted_at`: null for active notes, timestamp for deleted

---

## 🔄 Sync Architecture

### How Offline-First Sync Works

```
┌─────────────────────────────────────────────────────────┐
│                    User Action                           │
│         (Create/Update/Delete Note)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Save to AsyncStorage                        │
│         (Immediate, always succeeds)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
            ┌─────────┴─────────┐
            │   Is Online?      │
            └─────────┬─────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐         ┌──────────────┐
│   YES        │         │     NO        │
│              │         │               │
│ Sync to      │         │ Add to        │
│ Supabase     │         │ Sync Queue    │
│              │         │               │
│ Mark as      │         │ Wait for     │
│ Synced       │         │ Connection    │
└──────────────┘         └──────────────┘
```

### Sync Flow

1. **Create Note Offline:**
   - Note saved locally with `local_*` ID
   - `synced: false`
   - Added to sync queue

2. **Go Online:**
   - Network detection triggers sync
   - `syncLocalChanges()` runs
   - Note created on Supabase
   - Local note ID updated to server ID
   - `synced: true`
   - Removed from sync queue

3. **Conflict Resolution:**
   - Compares `updated_at` timestamps
   - Server newer + local synced → Update local
   - Local newer → Sync local to server
   - Same timestamp → Mark as synced

4. **Sync from Server:**
   - Fetches all notes from Supabase
   - Merges with local notes
   - Updates local notes with server data if newer
   - Adds new server notes to local storage

---

## 🚀 Getting Started

### Prerequisites
- Node.js (>=18)
- React Native development environment
- Supabase account and project

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd FakeNotes
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Configure Supabase:**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Create the `notes_data` table (see Database Structure)
   - Update `src/supabase.js` with your credentials:
   ```javascript
   const SUPABASE_URL = 'your-project-url'
   const SUPABASE_ANON_KEY = 'your-anon-key'
   ```

4. **Run the app:**
```bash
# For Android
npm run android

# For iOS
npm run ios

# Start Metro bundler
npm start
```

---

## 📦 Dependencies

```json
{
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-native-clipboard/clipboard": "^1.16.3",
  "@react-navigation/native": "^7.1.19",
  "@react-navigation/native-stack": "^7.6.2",
  "@supabase/supabase-js": "^2.79.0",
  "react": "19.1.0",
  "react-native": "0.81.0",
  "react-native-safe-area-context": "^5.6.0",
  "react-native-screens": "^4.18.0",
  "react-native-url-polyfill": "^3.0.0"
}
```

---

## 🧠 Key Concepts

### 1. **Offline-First Architecture**
All operations work offline first, then sync when possible. This ensures:
- Instant response times
- Works without internet
- No data loss
- Seamless user experience

### 2. **Local IDs vs Server IDs**
- **Local IDs**: `local_1234567890_abc` - Temporary IDs for unsynced notes
- **Server IDs**: `42` - Permanent IDs from Supabase
- When note syncs, local ID is replaced with server ID

### 3. **Sync Status Tracking**
- `synced: false` - Note not yet synced to server
- `synced: true` - Note successfully synced
- Visual indicators show sync status in UI

### 4. **Soft Deletes**
Notes are marked as deleted (`deleted_at` timestamp) rather than removed:
- Allows recovery
- Syncs deletion to server
- Can be filtered out in queries

---

## 🔧 Configuration

### Supabase Setup

1. **Create Table:**
```sql
CREATE TABLE notes_data (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  user_id UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE notes_data ENABLE ROW LEVEL SECURITY;

-- Create policy (adjust as needed)
CREATE POLICY "Users can view own notes"
  ON notes_data FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
```

2. **Update Supabase Config:**
Edit `src/supabase.js` with your project credentials.

---

## 🧪 Testing Offline Functionality

1. **Test Offline Mode:**
   - Turn off WiFi/Mobile data
   - Create/edit notes
   - Verify notes are saved locally
   - Check sync status indicators

2. **Test Sync:**
   - Create notes offline
   - Turn on internet
   - Verify automatic sync
   - Check sync status updates

3. **Test Conflict Resolution:**
   - Edit same note on multiple devices
   - Verify latest changes win
   - Check no data loss

---

## 🐛 Troubleshooting

### Notes not syncing?
- Check network connection
- Verify Supabase credentials
- Check console for sync errors
- Try manual sync button

### Notes showing as deleted?
- Check `deleted_at` field
- Verify sync logic
- Check server data

### Network detection not working?
- Verify Supabase connection
- Check timeout settings
- Review network detection logs

---

## 📝 Code Examples

### Creating a Note (Offline-First)
```javascript
// User creates note
const noteId = await saveNote('My Note', 'Content here');

// Internally:
// 1. Saved to AsyncStorage immediately
// 2. If online → synced to Supabase
// 3. If offline → queued for later sync
```

### Syncing Manually
```javascript
import { manualSync } from './src/database/db';

const result = await manualSync();
if (result.success) {
  console.log('Sync completed!');
} else {
  console.error('Sync failed:', result.message);
}
```

### Checking Network Status
```javascript
import { isOnlineNow } from './src/utils/networkDetection';

const online = await isOnlineNow();
console.log('Online:', online);
```

---

## 📄 License

This project is not open source and is not licensed for public use.

---

## 👤 Author

**Hamza Nazir**

---

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- React Native community
- AsyncStorage for offline persistence

---

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)

---

**Last Updated:** 2024

**Version:** 1.0.0
