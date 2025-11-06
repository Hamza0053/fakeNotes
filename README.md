# 📋 Auto Copy Notes App (React Native + SQLite)

## 🧠 Overview

This React Native app allows users to create notes with a title and content.
As the user types content, it is **automatically saved in SQLite** and **copied to the clipboard** in real-time.

The app consists of two main screens:

1. **Notes List Screen** — Displays all saved notes.
2. **Note Editor Screen** — Allows adding/editing a note (auto-save + auto-copy).

---

## ⚙️ Technical Stack

| Technology                                     | Purpose                                          |
| ---------------------------------------------- | ------------------------------------------------ |
| **React Native**                               | Cross-platform mobile framework                  |
| **Expo** *(recommended)*                       | Simplifies setup and supports clipboard + SQLite |
| **expo-sqlite**                                | Local data storage                               |
| **expo-clipboard**                             | Copy text to clipboard                           |
| **React Navigation**                           | Screen navigation                                |
| **React Native Paper / Elements** *(optional)* | For clean UI components                          |

---

## 🧩 App Features

* View list of all saved notes
* Add new note (title + content)
* Auto-save note content to SQLite while typing
* Auto-copy content to clipboard
* Delete or edit existing notes (optional future upgrade)

---

## 🗄️ Database Structure

**Table:** `notes`

| Column       | Type                              | Description            |
| ------------ | --------------------------------- | ---------------------- |
| `id`         | INTEGER PRIMARY KEY AUTOINCREMENT | Unique note ID         |
| `title`      | TEXT                              | Note title             |
| `content`    | TEXT                              | Note body              |
| `created_at` | TEXT                              | Timestamp when created |
| `updated_at` | TEXT                              | Timestamp when updated |

---

## 🏗️ Folder Structure

```
AutoCopyNotesApp/
├── src/
│   ├── screens/
│   │   ├── NotesListScreen.js
│   │   └── NoteEditorScreen.js
│   ├── database/
│   │   └── db.js
│   ├── components/
│   │   └── NoteCard.js
│   ├── utils/
│   │   └── clipboard.js
│   └── App.js
├── package.json
└── README.md
```

---

## 📦 Dependencies

```bash
expo install expo-sqlite expo-clipboard react-native-paper @react-navigation/native @react-navigation/native-stack
```

Then install navigation dependencies:

```bash
npx expo install react-native-screens react-native-safe-area-context
```

---

## 🚀 Basic Flow

### **1. Notes List Screen (`NotesListScreen.js`)**

* Fetch all notes from SQLite.
* Display them in a scrollable list.
* “+” button to add a new note → navigates to **NoteEditorScreen**.

### **2. Note Editor Screen (`NoteEditorScreen.js`)**

* Input fields for **title** and **content**.
* On typing in content:

  * Save/update note in SQLite.
  * Copy current text to clipboard automatically using:

    ```js
    import * as Clipboard from 'expo-clipboard';
    Clipboard.setStringAsync(content);
    ```
* On back navigation → auto-refresh notes list.

---

## 💾 Database Setup (`db.js`)

```js
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('notes.db');

export const initDB = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        created_at TEXT,
        updated_at TEXT
      );`
    );
  });
};

export const getNotes = (callback) => {
  db.transaction(tx => {
    tx.executeSql('SELECT * FROM notes ORDER BY id DESC;', [], (_, { rows }) => {
      callback(rows._array);
    });
  });
};

export const saveNote = (title, content) => {
  const now = new Date().toISOString();
  db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, ?, ?);',
      [title, content, now, now]
    );
  });
};

export const updateNote = (id, content) => {
  const now = new Date().toISOString();
  db.transaction(tx => {
    tx.executeSql(
      'UPDATE notes SET content = ?, updated_at = ? WHERE id = ?;',
      [content, now, id]
    );
  });
};
```

---

## 🧠 Logic Summary

1. **Launch app → NotesListScreen**

   * Fetch and show all notes.
2. **Click “+” → Navigate to NoteEditorScreen**

   * Type title and content.
   * As user types → content saved to SQLite and copied to clipboard.
3. **Navigate back → Notes list updates automatically.**

---

## ✅ Future Enhancements

* Edit existing notes
* Delete notes
* Search functionality
* Cloud sync (Firebase / Supabase)
* Dark mode

---

## 🧪 Run App

```bash
npm start
# or
npx expo start
```

Then scan the QR code with the Expo Go app.

---

**Author:** Hamza Nazir
**Purpose:** Mobile app to auto-copy and auto-save notes locally.
