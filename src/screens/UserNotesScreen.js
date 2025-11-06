import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getUserNotes } from '../database/db';
import NoteCard from '../components/NoteCard';

const UserNotesScreen = ({ route, navigation }) => {
  const { user } = route.params || {};
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const loadNotes = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const userNotes = await getUserNotes(user.id);
      setNotes(userNotes);
    } catch (error) {
      console.error('Error loading user notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  if (loading && notes.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {user?.full_name || 'User'}'s Notes
          </Text>
          <Text style={styles.headerSubtitle}>{user?.email || ''}</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      </View>
    );
  }

  const handleNotePress = (note) => {
    navigation.navigate('NoteEditor', { note, readOnly: true });
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No notes found</Text>
      <Text style={styles.emptySubtext}>
        {user?.full_name || 'This user'} hasn't created any notes yet
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {user?.full_name || 'User'}'s Notes
        </Text>
        <Text style={styles.headerSubtitle}>{user?.email || ''}</Text>
      </View>
      <FlatList
        data={notes}
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => handleNotePress(item)} />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          notes.length === 0 ? styles.emptyList : styles.listContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
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
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    letterSpacing: 0.2,
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
  loadingContainer: {
    justifyContent: 'flex-start',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default UserNotesScreen;

