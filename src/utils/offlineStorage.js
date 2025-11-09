import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_STORAGE_KEY = '@notes_data';
const SYNC_QUEUE_KEY = '@sync_queue';
const LAST_SYNC_KEY = '@last_sync';

// Get all notes from local storage
export const getLocalNotes = async () => {
  try {
    const notesJson = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
    if (notesJson) {
      return JSON.parse(notesJson);
    }
    return [];
  } catch (error) {
    console.error('Error getting local notes:', error);
    return [];
  }
};

// Save notes to local storage
export const saveLocalNotes = async (notes) => {
  try {
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch (error) {
    console.error('Error saving local notes:', error);
    return false;
  }
};

// Get a single note by ID from local storage
export const getLocalNote = async (id) => {
  try {
    const notes = await getLocalNotes();
    return notes.find(note => note.id === id) || null;
  } catch (error) {
    console.error('Error getting local note:', error);
    return null;
  }
};

// Add or update a note in local storage
export const saveLocalNote = async (note) => {
  try {
    const notes = await getLocalNotes();
    const existingIndex = notes.findIndex(n => n.id === note.id);
    
    if (existingIndex >= 0) {
      // Update existing note - explicitly handle deleted_at
      const updatedNote = {
        ...notes[existingIndex],
        ...note,
        updated_at: note.updated_at || new Date().toISOString(),
      };
      
      // Only set deleted_at if explicitly provided, otherwise keep existing value or null
      if ('deleted_at' in note) {
        updatedNote.deleted_at = note.deleted_at;
      } else if (!updatedNote.deleted_at) {
        updatedNote.deleted_at = null; // Explicitly set to null if not deleted
      }
      
      notes[existingIndex] = updatedNote;
    } else {
      // Add new note - explicitly set deleted_at to null
      const newNote = {
        ...note,
        id: note.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: note.created_at || new Date().toISOString(),
        updated_at: note.updated_at || new Date().toISOString(),
        deleted_at: note.deleted_at || null, // Explicitly set to null for new notes
        synced: note.synced !== undefined ? note.synced : false, // Mark as not synced if not specified
      };
      notes.push(newNote);
    }
    
    await saveLocalNotes(notes);
    return true;
  } catch (error) {
    console.error('Error saving local note:', error);
    return false;
  }
};

// Delete a note from local storage (soft delete)
export const deleteLocalNote = async (id) => {
  try {
    const notes = await getLocalNotes();
    const noteIndex = notes.findIndex(n => n.id === id);
    
    if (noteIndex >= 0) {
      notes[noteIndex] = {
        ...notes[noteIndex],
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false, // Mark as not synced
      };
      await saveLocalNotes(notes);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting local note:', error);
    return false;
  }
};

// Sync Queue Management
export const getSyncQueue = async () => {
  try {
    const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (queueJson) {
      return JSON.parse(queueJson);
    }
    return [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

export const addToSyncQueue = async (operation) => {
  try {
    const queue = await getSyncQueue();
    // Check if operation already exists for this note
    const existingIndex = queue.findIndex(
      op => op.noteId === operation.noteId && op.type === operation.type
    );
    
    if (existingIndex >= 0) {
      // Update existing operation
      queue[existingIndex] = operation;
    } else {
      // Add new operation
      queue.push({
        ...operation,
        timestamp: new Date().toISOString(),
      });
    }
    
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    return false;
  }
};

export const removeFromSyncQueue = async (operationId) => {
  try {
    const queue = await getSyncQueue();
    const filteredQueue = queue.filter(op => op.id !== operationId);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filteredQueue));
    return true;
  } catch (error) {
    console.error('Error removing from sync queue:', error);
    return false;
  }
};

export const clearSyncQueue = async () => {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing sync queue:', error);
    return false;
  }
};

// Mark note as synced
export const markNoteAsSynced = async (noteId) => {
  try {
    const notes = await getLocalNotes();
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex >= 0) {
      notes[noteIndex].synced = true;
      await saveLocalNotes(notes);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking note as synced:', error);
    return false;
  }
};

// Get last sync timestamp
export const getLastSyncTime = async () => {
  try {
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return lastSync ? new Date(lastSync) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

// Set last sync timestamp
export const setLastSyncTime = async () => {
  try {
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error setting last sync time:', error);
    return false;
  }
};

// Check if a note ID is a local ID (not synced yet)
export const isLocalId = (id) => {
  return typeof id === 'string' && id.startsWith('local_');
};

