import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  saveNote,
  updateNote,
  updateNoteTitle,
  deleteNote,
} from '../database/db';

const NoteEditorScreen = ({ route, navigation }) => {
  const { note, readOnly } = route.params || {};
  const isEditing = note !== null && note.id;

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [currentNoteId, setCurrentNoteId] = useState(note?.id || null);
  const saveTimeoutRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const hasInitialized = useRef(false);
  const isSavingRef = useRef(false);
  const currentNoteIdRef = useRef(note?.id || null);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        currentNoteId && !readOnly ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        ) : null
      ),
    });
  }, [currentNoteId, readOnly]);

  // Initialize note ID if editing
  useEffect(() => {
    if (note && note.id && !hasInitialized.current) {
      setCurrentNoteId(note.id);
      currentNoteIdRef.current = note.id;
      hasInitialized.current = true;
    } else if (!note && !hasInitialized.current) {
      hasInitialized.current = true;
    }
  }, [note]);

  // Ensure note is saved before leaving screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
      // Clear any pending save timeout and save immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Save any unsaved changes before leaving
      if (!readOnly && hasInitialized.current && (title.trim() || content.trim())) {
        // Wait a bit to let auto-save complete if it's running
        if (isSavingRef.current) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Use ref to get the latest note ID (avoid stale closure)
        const noteId = currentNoteIdRef.current;
        
        // Don't prevent default navigation, just save in background
        if (noteId) {
          // Update existing note - only if there are actual changes
          const originalNote = note || {};
          if (title !== (originalNote.title || '') || content !== (originalNote.content || '')) {
            if (!isSavingRef.current) {
              isSavingRef.current = true;
              try {
                if (title !== (originalNote.title || '')) {
                  await updateNoteTitle(noteId, title.trim() || 'Untitled');
                }
                if (content !== (originalNote.content || '')) {
                  await updateNote(noteId, content);
                }
              } finally {
                isSavingRef.current = false;
              }
            }
          }
        } else {
          // Only create new note if auto-save hasn't already created it
          if (!isSavingRef.current && (title.trim() || content.trim())) {
            isSavingRef.current = true;
            try {
              const newNoteId = await saveNote(
                title.trim() || 'Untitled',
                content
              );
              if (newNoteId) {
                setCurrentNoteId(newNoteId);
                currentNoteIdRef.current = newNoteId;
              }
            } finally {
              isSavingRef.current = false;
            }
          }
        }
      }
    });

    return unsubscribe;
  }, [navigation, title, content, readOnly, currentNoteId, note]);

  // Auto-save and auto-copy on content change
  useEffect(() => {
    // Skip save if read-only mode or not initialized yet
    if (readOnly || !hasInitialized.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 1000); // Debounce: save after 1 second of no typing

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, title, currentNoteId, readOnly]);

  // Auto-copy content to clipboard - DISABLED to prevent toast notifications
  // useEffect(() => {
  //   if (copyTimeoutRef.current) {
  //     clearTimeout(copyTimeoutRef.current);
  //   }

  //   if (content.trim().length > 0) {
  //     copyTimeoutRef.current = setTimeout(() => {
  //       handleAutoCopy();
  //     }, 500); // Copy after 0.5 seconds of no typing
  //   }

  //   return () => {
  //     if (copyTimeoutRef.current) {
  //       clearTimeout(copyTimeoutRef.current);
  //     }
  //   };
  // }, [content]);

  const handleAutoSave = async () => {
    // Don't save if both fields are empty or already saving
    if ((!title.trim() && !content.trim()) || isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      if (currentNoteId) {
        // Update existing note
        const originalNote = note || {};
        if (title !== (originalNote.title || '')) {
          await updateNoteTitle(currentNoteId, title.trim() || 'Untitled');
        }
        if (content !== (originalNote.content || '')) {
          await updateNote(currentNoteId, content);
        }
      } else {
        // Create new note only if we don't have an ID yet
        if (title.trim() || content.trim()) {
          const newNoteId = await saveNote(
            title.trim() || 'Untitled',
            content
          );
          if (newNoteId) {
            setCurrentNoteId(newNoteId);
            currentNoteIdRef.current = newNoteId;
            // Update navigation params to reflect we're now editing
            navigation.setParams({ note: { id: newNoteId, title, content } });
          }
        }
      }
    } catch (error) {
      console.error('Error auto-saving note:', error);
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleAutoCopy = async () => {
    if (content.trim().length > 0) {
      try {
        await Clipboard.setString(content);
        console.log('Content copied to clipboard');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        // If clipboard permission denied, show alert only once
        if (error.message && error.message.includes('permission')) {
          Alert.alert(
            'Clipboard Permission',
            'This app needs clipboard permission to auto-copy your notes. Please grant permission in settings.',
            [{ text: 'OK' }]
          );
        }
      }
    }
  };

  const handleDelete = () => {
    if (!currentNoteId) return;
    
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(currentNoteId);
              // Navigate back immediately after successful deletion
              setTimeout(() => {
                navigation.goBack();
              }, 100);
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.titleInput}
          placeholder="Note Title"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          multiline={false}
          editable={!readOnly}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.contentInput}
          placeholder="Start typing... (auto-saved)"
          placeholderTextColor="#999"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          editable={!readOnly}
        />
      </View>
      {readOnly && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>Read-only mode - Viewing as admin</Text>
        </View>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          ✓ Auto-saving to database...
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  inputContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    paddingVertical: 12,
    minHeight: 56,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  contentInput: {
    fontSize: 16,
    color: '#374151',
    paddingVertical: 12,
    minHeight: 350,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#eef2ff',
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginVertical: 6,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  deleteButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  readOnlyBanner: {
    backgroundColor: '#f59e0b',
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  readOnlyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default NoteEditorScreen;

