import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDB } from './src/database/db';
import NotesListScreen from './src/screens/NotesListScreen';
import NoteEditorScreen from './src/screens/NoteEditorScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Initialize database and network detection when app starts
    initDB().catch((error) => {
      console.error('Failed to initialize database:', error);
    });
  }, []);

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
          <Stack.Screen
            name="NotesList"
            component={NotesListScreen}
            options={{ title: 'My Notes' }}
          />
          <Stack.Screen
            name="NoteEditor"
            component={NoteEditorScreen}
            options={{ title: 'Note Editor' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
