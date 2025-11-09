import { supabase } from '../supabase';
import {
  getLocalNotes,
  saveLocalNotes,
  saveLocalNote,
  deleteLocalNote,
  getLocalNote,
  addToSyncQueue,
  markNoteAsSynced,
  isLocalId,
} from '../utils/offlineStorage';
import { isOnlineNow } from '../utils/networkDetection';

// Initialize database and sync
export const initDB = async () => {
  try {
    // Initialize network detection
    const { initNetworkDetection } = await import('../utils/networkDetection');
    await initNetworkDetection();
    
    // Try to sync on startup if online
    const online = await isOnlineNow();
    if (online) {
      // Test connection
      const { error } = await supabase.from('notes_data').select('id').limit(1);
      if (!error) {
        console.log('Database initialized successfully');
        // Sync local changes with server
        await syncLocalChanges();
        // Sync server changes to local
        await syncFromServer();
      } else {
        console.error('Database connection error:', error);
      }
    } else {
      console.log('Database initialized (offline mode)');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Get notes - offline-first: return local notes, sync if online
export const getNotes = async () => {
  try {
    // Always get notes from local storage first
    let localNotes = await getLocalNotes();
    
    // Filter out deleted notes
    localNotes = localNotes.filter(note => !note.deleted_at);
    
    // Try to sync from server if online
    const online = await isOnlineNow();
    if (online) {
      try {
        await syncFromServer();
        // Get updated local notes after sync
        localNotes = await getLocalNotes();
        localNotes = localNotes.filter(note => !note.deleted_at);
      } catch (error) {
        console.error('Error syncing from server:', error);
        // Continue with local notes if sync fails
      }
    }
    
    // Sort by updated_at descending
    localNotes.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB - dateA;
    });
    
    return localNotes;
  } catch (error) {
    console.error('Error getting notes:', error);
    // Return local notes as fallback
    const localNotes = await getLocalNotes();
    return localNotes.filter(note => !note.deleted_at);
  }
};

// Save note - offline-first: save locally, sync if online
export const saveNote = async (title, content) => {
  try {
    const newNote = {
      title: title || 'Untitled',
      content: content || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Save to local storage first
    await saveLocalNote(newNote);
    
    // Get the saved note with its ID
    const localNotes = await getLocalNotes();
    const savedNote = localNotes.find(n => 
      n.title === newNote.title && 
      n.content === newNote.content &&
      Math.abs(new Date(n.created_at) - new Date(newNote.created_at)) < 1000
    );
    
    if (!savedNote) {
      console.error('Failed to retrieve saved note');
      return null;
    }
    
    // Try to sync with server if online
    const online = await isOnlineNow();
    if (online && !isLocalId(savedNote.id)) {
      // If it's not a local ID, it's already synced
      return savedNote.id;
    }
    
    if (online) {
      try {
        // Add to sync queue
        await addToSyncQueue({
          id: `sync_${Date.now()}`,
          type: 'create',
          noteId: savedNote.id,
          note: savedNote,
        });
        
        // Try immediate sync
        await syncNoteToServer(savedNote);
      } catch (error) {
        console.error('Error syncing note to server:', error);
        // Note is saved locally, will sync later
      }
    } else {
      // Add to sync queue for later
      await addToSyncQueue({
        id: `sync_${Date.now()}`,
        type: 'create',
        noteId: savedNote.id,
        note: savedNote,
      });
    }
    
    console.log('Note saved successfully (local)');
    return savedNote.id;
  } catch (error) {
    console.error('Error saving note:', error);
    return null;
  }
};

// Update note - offline-first
export const updateNote = async (id, content) => {
  try {
    // Get current note
    const currentNote = await getLocalNote(id);
    if (!currentNote) {
      console.error('Note not found for update');
      return;
    }
    
    // Update locally first
    await saveLocalNote({
      ...currentNote,
      content: content,
      updated_at: new Date().toISOString(),
      synced: false,
    });
    
    // Try to sync with server if online
    const online = await isOnlineNow();
    if (online) {
      try {
        if (!isLocalId(id)) {
          // Update on server
          const { error } = await supabase
            .from('notes_data')
            .update({
              content: content,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);
          
          if (!error) {
            await markNoteAsSynced(id);
            console.log('Note updated successfully (synced)');
            return;
          }
        }
        
        // Add to sync queue if sync failed or is local ID
        await addToSyncQueue({
          id: `sync_${Date.now()}`,
          type: 'update',
          noteId: id,
          field: 'content',
          value: content,
        });
        
        // Try immediate sync
        await syncNoteToServer(await getLocalNote(id));
      } catch (error) {
        console.error('Error syncing update to server:', error);
      }
    } else {
      // Add to sync queue for later
      await addToSyncQueue({
        id: `sync_${Date.now()}`,
        type: 'update',
        noteId: id,
        field: 'content',
        value: content,
      });
    }
    
    console.log('Note updated successfully (local)');
  } catch (error) {
    console.error('Error updating note:', error);
  }
};

// Update note title - offline-first
export const updateNoteTitle = async (id, title) => {
  try {
    // Get current note
    const currentNote = await getLocalNote(id);
    if (!currentNote) {
      console.error('Note not found for title update');
      return;
    }
    
    // Update locally first
    await saveLocalNote({
      ...currentNote,
      title: title,
      updated_at: new Date().toISOString(),
      synced: false,
    });
    
    // Try to sync with server if online
    const online = await isOnlineNow();
    if (online) {
      try {
        if (!isLocalId(id)) {
          // Update on server
          const { error } = await supabase
            .from('notes_data')
            .update({
              title: title,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);
          
          if (!error) {
            await markNoteAsSynced(id);
            console.log('Note title updated successfully (synced)');
            return;
          }
        }
        
        // Add to sync queue if sync failed or is local ID
        await addToSyncQueue({
          id: `sync_${Date.now()}`,
          type: 'update',
          noteId: id,
          field: 'title',
          value: title,
        });
        
        // Try immediate sync
        await syncNoteToServer(await getLocalNote(id));
      } catch (error) {
        console.error('Error syncing title update to server:', error);
      }
    } else {
      // Add to sync queue for later
      await addToSyncQueue({
        id: `sync_${Date.now()}`,
        type: 'update',
        noteId: id,
        field: 'title',
        value: title,
      });
    }
    
    console.log('Note title updated successfully (local)');
  } catch (error) {
    console.error('Error updating note title:', error);
  }
};

// Delete note - offline-first
export const deleteNote = async (id) => {
  try {
    // Delete locally first (soft delete)
    await deleteLocalNote(id);
    
    // Try to sync with server if online
    const online = await isOnlineNow();
    if (online) {
      try {
        if (!isLocalId(id)) {
          // Delete on server
          const { error } = await supabase
            .from('notes_data')
            .update({
              deleted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);
          
          if (!error) {
            await markNoteAsSynced(id);
            console.log('Note deleted successfully (synced)');
            return;
          }
        }
        
        // Add to sync queue if sync failed or is local ID
        await addToSyncQueue({
          id: `sync_${Date.now()}`,
          type: 'delete',
          noteId: id,
        });
        
        // Try immediate sync
        const note = await getLocalNote(id);
        if (note) {
          await syncNoteToServer(note);
        }
      } catch (error) {
        console.error('Error syncing delete to server:', error);
      }
    } else {
      // Add to sync queue for later
      await addToSyncQueue({
        id: `sync_${Date.now()}`,
        type: 'delete',
        noteId: id,
      });
    }
    
    console.log('Note deleted successfully (local)');
  } catch (error) {
    console.error('Error deleting note:', error);
  }
};

// Get user notes (for admin view)
export const getUserNotes = async (userId) => {
  try {
    const online = await isOnlineNow();
    if (online) {
      const { data, error } = await supabase
        .from('notes_data')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('id', { ascending: false });
      
      if (error) {
        console.error('Error getting user notes:', error);
        return [];
      }
      
      return data || [];
    } else {
      // Return empty array if offline (user notes are server-only)
      return [];
    }
  } catch (error) {
    console.error('Error getting user notes:', error);
    return [];
  }
};

// Sync a single note to server
const syncNoteToServer = async (note) => {
  if (!note || isLocalId(note.id)) {
    // This is a new note, create it on server
    try {
      const { data, error } = await supabase
        .from('notes_data')
        .insert([{
          title: note.title,
          content: note.content,
        }])
        .select()
        .single();
      
      if (!error && data) {
        // Update local note with server ID and server data
        const localNotes = await getLocalNotes();
        const noteIndex = localNotes.findIndex(n => n.id === note.id);
        if (noteIndex >= 0) {
          const oldNote = localNotes[noteIndex];
          localNotes[noteIndex] = {
            ...oldNote,
            ...data,
            id: data.id,
            synced: true,
            // Preserve local updated_at if it's newer
            updated_at: oldNote.updated_at > data.updated_at ? oldNote.updated_at : data.updated_at,
          };
          await saveLocalNotes(localNotes);
        }
        return true;
      }
    } catch (error) {
      console.error('Error creating note on server:', error);
      return false;
    }
  } else {
    // This is an existing note, update it on server
    try {
      const { error } = await supabase
        .from('notes_data')
        .update({
          title: note.title,
          content: note.content,
          updated_at: note.updated_at,
          deleted_at: note.deleted_at,
        })
        .eq('id', note.id);
      
      if (!error) {
        await markNoteAsSynced(note.id);
        return true;
      }
    } catch (error) {
      console.error('Error updating note on server:', error);
      return false;
    }
  }
  return false;
};

// Sync all local changes to server
export const syncLocalChanges = async () => {
  try {
    const online = await isOnlineNow();
    if (!online) {
      console.log('Cannot sync: offline');
      return;
    }
    
    const localNotes = await getLocalNotes();
    const unsyncedNotes = localNotes.filter(note => !note.synced || isLocalId(note.id));
    
    console.log(`Syncing ${unsyncedNotes.length} notes to server...`);
    
    for (const note of unsyncedNotes) {
      try {
        const success = await syncNoteToServer(note);
        if (success) {
          // After successful sync, ensure the note is marked as synced
          // This is especially important for notes that got new server IDs
          const updatedNotes = await getLocalNotes();
          const updatedNote = updatedNotes.find(n => {
            // Find by original ID or new server ID
            if (isLocalId(note.id)) {
              // If it was a local ID, find by matching title/content/timestamp
              return n.title === note.title && 
                     n.content === note.content &&
                     Math.abs(new Date(n.created_at) - new Date(note.created_at)) < 2000;
            } else {
              return n.id === note.id;
            }
          });
          
          if (updatedNote && !updatedNote.synced) {
            await markNoteAsSynced(updatedNote.id);
          }
        }
      } catch (error) {
        console.error(`Error syncing note ${note.id}:`, error);
      }
    }
    
    console.log('Local changes synced to server');
  } catch (error) {
    console.error('Error syncing local changes:', error);
  }
};

// Sync from server to local
export const syncFromServer = async () => {
  try {
    const online = await isOnlineNow();
    if (!online) {
      console.log('Cannot sync: offline');
      return;
    }
    
    // Get all notes from server (including deleted ones for sync purposes)
    const { data: serverNotes, error } = await supabase
      .from('notes_data')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching notes from server:', error);
      return;
    }
    
    // Get local notes
    const localNotes = await getLocalNotes();
    const localNotesMap = new Map(localNotes.map(note => [note.id, note]));
    
    // Merge server notes with local notes
    for (const serverNote of serverNotes || []) {
      const localNote = localNotesMap.get(serverNote.id);
      
      if (!localNote) {
        // New note from server, add to local (only if not deleted)
        if (!serverNote.deleted_at) {
          await saveLocalNote({
            ...serverNote,
            synced: true,
            deleted_at: null, // Explicitly set to null
          });
        }
      } else {
        // Note exists locally
        const serverUpdated = new Date(serverNote.updated_at || 0);
        const localUpdated = new Date(localNote.updated_at || 0);
        
        // If local note is already synced, preserve that status
        const wasSynced = localNote.synced || !isLocalId(localNote.id);
        
        if (serverUpdated > localUpdated && wasSynced) {
          // Server version is newer and local was synced, update local
          await saveLocalNote({
            ...serverNote,
            synced: true, // Preserve synced status
          });
        } else if (!wasSynced || isLocalId(localNote.id)) {
          // Local note is not synced yet (has local ID or synced: false)
          // This means it was just created offline and needs to be synced
          // Don't overwrite it with server data, let syncLocalChanges handle it
          continue;
        } else if (localUpdated > serverUpdated) {
          // Local is newer, sync it to server
          await syncNoteToServer(localNote);
        } else if (localUpdated.getTime() === serverUpdated.getTime()) {
          // Same timestamp, just ensure synced status is set
          if (!localNote.synced) {
            await markNoteAsSynced(localNote.id);
          }
        } else {
          // Server is newer, update local but preserve synced status
          await saveLocalNote({
            ...serverNote,
            synced: true,
          });
        }
      }
    }
    
    // After syncing from server, ensure all notes that exist on server are marked as synced
    const serverNoteIds = new Set((serverNotes || []).map(note => note.id));
    const localNotesAfterSync = await getLocalNotes();
    
    for (const localNote of localNotesAfterSync) {
      // If note exists on server and has server ID, it should be marked as synced
      if (serverNoteIds.has(localNote.id) && !isLocalId(localNote.id) && !localNote.synced) {
        await markNoteAsSynced(localNote.id);
      }
    }
    
    // Mark local notes as deleted if they're deleted on server (and were synced)
    for (const serverNote of serverNotes || []) {
      if (serverNote.deleted_at) {
        const localNote = localNotesAfterSync.find(n => n.id === serverNote.id);
        if (localNote && (localNote.synced || !isLocalId(localNote.id))) {
          await saveLocalNote({
            ...localNote,
            deleted_at: serverNote.deleted_at,
            synced: true,
          });
        }
      }
    }
    
    console.log('Synced from server to local');
  } catch (error) {
    console.error('Error syncing from server:', error);
  }
};

// Manual sync function (can be called by user)
export const manualSync = async () => {
  try {
    const online = await isOnlineNow();
    if (!online) {
      return { success: false, message: 'No internet connection' };
    }
    
    // First, sync local changes to server (this updates local IDs to server IDs)
    await syncLocalChanges();
    
    // Wait a bit to ensure local storage is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Then, sync server changes to local (this ensures everything is in sync)
    await syncFromServer();
    
    return { success: true, message: 'Sync completed' };
  } catch (error) {
    console.error('Error in manual sync:', error);
    return { success: false, message: error.message };
  }
};
