import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getNotes, manualSync } from '../database/db';
import { isOnlineNow, subscribeToNetworkChanges } from '../utils/networkDetection';
import { getLocalNotes } from '../utils/offlineStorage';
import NoteCard from '../components/NoteCard';
import {
  initializePermissionOnFirstLoad,
  setClipboardPermission,
  testClipboardAccess,
} from '../utils/clipboardPermission';

const NotesListScreen = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const insets = useSafeAreaInsets();
  const handleManualSyncRef = useRef(null);

  const loadNotes = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const allNotes = await getNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleManualSync = useCallback(async () => {
    const online = await isOnlineNow();
    if (!online || syncing) return;
    
    setSyncing(true);
    try {
      const result = await manualSync();
      if (result.success) {
        await loadNotes(false);
        // Update unsynced count
        const localNotes = await getLocalNotes();
        const unsynced = localNotes.filter(note => !note.synced && !note.deleted_at);
        setUnsyncedCount(unsynced.length);
      } else {
        Alert.alert('Sync Failed', result.message || 'Failed to sync notes');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      Alert.alert('Sync Error', 'An error occurred while syncing');
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Store ref for use in network change handler
  handleManualSyncRef.current = handleManualSync;

  // Check network status and unsynced notes
  useEffect(() => {
    const checkStatus = async () => {
      const online = await isOnlineNow();
      setIsOnline(online);
      
      // Count unsynced notes
      const localNotes = await getLocalNotes();
      const unsynced = localNotes.filter(note => !note.synced && !note.deleted_at);
      setUnsyncedCount(unsynced.length);
    };
    
    checkStatus();
    
    // Subscribe to network changes
    const unsubscribe = subscribeToNetworkChanges((online) => {
      setIsOnline(online);
      if (online && handleManualSyncRef.current) {
        // Auto-sync when coming back online
        handleManualSyncRef.current();
      }
    });
    
    return unsubscribe;
  }, []);

  // Check for clipboard permission on first launch
  useEffect(() => {
    const checkPermission = async () => {
      // Initialize permission on first load - returns true if first time
      const isFirstLoad = await initializePermissionOnFirstLoad();
      console.log("this is permission modal - isFirstLoad:", isFirstLoad);
      if (isFirstLoad) {
        setShowPermissionModal(true);
      }
    };
    checkPermission();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Show loading indicator when coming back from note editor
      // Small delay to ensure database operations are complete after navigation
      const timer = setTimeout(() => {
        loadNotes(true);
      }, 100);
      return () => clearTimeout(timer);
    }, [])
  );

  const handlePermissionGrant = async () => {
    try {
      // Test clipboard access
      const hasAccess = await testClipboardAccess();
      await setClipboardPermission(hasAccess);
      setShowPermissionModal(false);
      
      if (!hasAccess) {
        Alert.alert(
          'Clipboard Access',
          'Clipboard access may be restricted on your device. You can enable it in your device settings if needed.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error granting clipboard permission:', error);
      await setClipboardPermission(false);
      setShowPermissionModal(false);
    }
  };

  const handlePermissionDeny = async () => {
    await setClipboardPermission(false);
    setShowPermissionModal(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes(false);
    // Update unsynced count after refresh
    const localNotes = await getLocalNotes();
    const unsynced = localNotes.filter(note => !note.synced && !note.deleted_at);
    setUnsyncedCount(unsynced.length);
    setRefreshing(false);
  };

  const handleNotePress = (note) => {
    navigation.navigate('NoteEditor', { note });
  };


  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No notes yet</Text>
      <Text style={styles.emptySubtext}>Tap the + button to create your first note</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sync Status Bar */}
      {(!isOnline || unsyncedCount > 0) && (
        <View style={[styles.syncBar, !isOnline && styles.syncBarOffline]}>
          <Text style={styles.syncBarText}>
            {!isOnline 
              ? '📡 Offline - Changes will sync when online'
              : `🔄 ${unsyncedCount} note${unsyncedCount !== 1 ? 's' : ''} pending sync`}
          </Text>
          {isOnline && unsyncedCount > 0 && (
            <TouchableOpacity
              onPress={handleManualSync}
              disabled={syncing}
              style={styles.syncButton}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text style={styles.syncButtonText}>Sync Now</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={({ item }) => (
            <NoteCard note={item} onPress={() => handleNotePress(item)} />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            notes.length === 0 ? styles.emptyList : styles.listContent,
            { paddingBottom: insets.bottom + 100 }
          ]}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => navigation.navigate('NoteEditor', { note: null })}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Clipboard Permission Modal */}
      <Modal
        visible={showPermissionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handlePermissionDeny}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📋 Clipboard Permission</Text>
            <Text style={styles.modalText}>
              This app can automatically copy your notes to the clipboard for easy sharing.
              {'\n\n'}
              Would you like to enable this feature?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDeny, { marginRight: 6 }]}
                onPress={handlePermissionDeny}
              >
                <Text style={styles.modalButtonTextDeny}>Not Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAllow, { marginLeft: 6 }]}
                onPress={handlePermissionGrant}
              >
                <Text style={styles.modalButtonTextAllow}>Allow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 18,
    paddingBottom: 18,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  listContent: {
    paddingTop: 12,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  fabText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonDeny: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonAllow: {
    backgroundColor: '#6366f1',
  },
  modalButtonTextDeny: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextAllow: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  syncBar: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
  },
  syncBarOffline: {
    backgroundColor: '#fef3c7',
    borderBottomColor: '#fde68a',
  },
  syncBarText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
    flex: 1,
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    marginLeft: 12,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotesListScreen;

