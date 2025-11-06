import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from './src/supabase';
import { initDB } from './src/database/db';
import NotesListScreen from './src/screens/NotesListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NoteEditorScreen from './src/screens/NoteEditorScreen';
import UserNotesScreen from './src/screens/UserNotesScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize database when app starts
    initDB().catch((error) => {
      console.error('Failed to initialize database:', error);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null; // Or a loading screen
  }

  const TabIcon = ({ focused, icon }: { focused: boolean; icon: string }) => (
    <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
      {icon}
    </Text>
  );

  const MainTabs = () => (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 20,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
      }}
    >
      <Tab.Screen
        name="NotesTab"
        component={NotesListScreen}
        options={{
          title: 'My Notes',
          tabBarLabel: 'Notes',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} icon="📝" />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} icon="👤" />
          ),
        }}
      />
    </Tab.Navigator>
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#6366f1',
            },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
            },
          }}
        >
          {session ? (
            // Authenticated screens
            <>
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="NoteEditor"
                component={NoteEditorScreen}
                options={{ title: 'Note Editor' }}
              />
              <Stack.Screen
                name="UserNotes"
                component={UserNotesScreen}
                options={{ title: 'User Notes' }}
              />
            </>
          ) : (
            // Auth screens
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SignUp"
                component={SignUpScreen}
                options={{ 
                  title: 'Create Account',
                  headerBackTitle: 'Sign In'
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const tabStyles = StyleSheet.create({
  icon: {
    fontSize: 22,
    color: '#9ca3af',
  },
  iconActive: {
    color: '#6366f1',
  },
});
