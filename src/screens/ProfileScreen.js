import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { getCurrentUser, getAllUsers } from '../database/db';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      
      // If user is admin, load all users
      if (userData?.is_admin) {
        setUsersLoading(true);
        const allUsers = await getAllUsers();
        setUsers(allUsers);
        setUsersLoading(false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleUserPress = (selectedUser) => {
    navigation.navigate('UserNotes', { user: selectedUser });
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name || 'No Name'}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.is_admin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>Admin</Text>
          </View>
        )}
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.full_name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        {user?.is_admin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>Administrator</Text>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Created</Text>
          <Text style={styles.infoValue}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : 'N/A'}
          </Text>
        </View>
      </View>

      {user?.is_admin && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Users Management</Text>
          {usersLoading ? (
            <ActivityIndicator size="small" color="#6366f1" style={styles.loader} />
          ) : (
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No users found</Text>
              }
            />
          )}
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  adminBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  adminText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  adminSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    letterSpacing: 0.1,
  },
  arrow: {
    fontSize: 24,
    color: '#6366f1',
    marginLeft: 12,
    fontWeight: '300',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: 24,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  loader: {
    marginVertical: 24,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  logoutText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;

