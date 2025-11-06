import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getNotes } from '../database/db';
import NoteCard from '../components/NoteCard';

const NotesListScreen = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes(false);
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
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>My Notes</Text>
      </View> */}
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
});

export default NotesListScreen;

