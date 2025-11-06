import { supabase } from '../supabase';

// Helper function to get current user ID
const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
};

export const initDB = async () => {
  try {
    // Test connection by attempting to fetch notes
    const { error } = await supabase.from('notes').select('id').limit(1);
    if (error) {
      console.error('Database connection error:', error);
      throw error;
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

export const getNotes = async () => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user session found');
      return [];
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('id', { ascending: false });
    
    if (error) {
      console.error('Error getting notes:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting notes:', error);
    return [];
  }
};

export const saveNote = async (title, content) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user session found');
      return null;
    }

    const now = new Date().toISOString();
    const newNote = {
      user_id: userId,
      title: title || 'Untitled',
      content: content || '',
      created_at: now,
      updated_at: now,
    };
    
    const { data, error } = await supabase
      .from('notes')
      .insert([newNote])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving note:', error);
      return null;
    }
    
    console.log('Note saved successfully');
    return data.id;
  } catch (error) {
    console.error('Error saving note:', error);
    return null;
  }
};

export const updateNote = async (id, content) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user session found');
      return;
    }

    const { error } = await supabase
      .from('notes')
      .update({
        content: content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId); // Ensure user owns the note
    
    if (error) {
      console.error('Error updating note:', error);
      return;
    }
    
    console.log('Note updated successfully');
  } catch (error) {
    console.error('Error updating note:', error);
  }
};

export const updateNoteTitle = async (id, title) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user session found');
      return;
    }

    const { error } = await supabase
      .from('notes')
      .update({
        title: title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId); // Ensure user owns the note
    
    if (error) {
      console.error('Error updating note title:', error);
      return;
    }
    
    console.log('Note title updated successfully');
  } catch (error) {
    console.error('Error updating note title:', error);
  }
};

export const deleteNote = async (id) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user session found');
      return;
    }

    const { error } = await supabase
      .from('notes')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId); // Ensure user owns the note
    
    if (error) {
      console.error('Error deleting note:', error);
      return;
    }
    
    console.log('Note deleted successfully');
  } catch (error) {
    console.error('Error deleting note:', error);
  }
};

// Admin functions
export const getCurrentUser = async () => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const getUserNotes = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error getting user notes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user notes:', error);
    return [];
  }
};
