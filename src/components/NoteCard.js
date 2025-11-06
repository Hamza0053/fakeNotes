import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const NoteCard = ({ note, onPress }) => {
  const isDeleted = note.deleted_at !== null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, isDeleted && styles.deletedTitle]}>
          {note.title || 'Untitled'}
        </Text>
        {isDeleted && (
          <View style={styles.deletedBadge}>
            <Text style={styles.deletedText}>DELETED</Text>
          </View>
        )}
      </View>
      <Text style={[styles.content, isDeleted && styles.deletedContent]} numberOfLines={2}>
        {note.content || 'No content'}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(note.updated_at || note.created_at).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
    flex: 1,
    marginRight: 8,
    lineHeight: 24,
  },
  deletedTitle: {
    color: '#6c757d',
    textDecorationLine: 'line-through',
  },
  deletedBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deletedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  content: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  deletedContent: {
    color: '#adb5bd',
  },
  timestamp: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
});

export default NoteCard;

