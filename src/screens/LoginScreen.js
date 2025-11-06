import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
        setLoading(false);
        return;
      }

      // User logged in successfully
      // The App.tsx will handle navigation based on auth state
      console.log('User logged in:', data.user.id);
      
      // Check clipboard permission after successful login
      await checkClipboardPermission();
      
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  const handleSignUpPress = () => {
    navigation.navigate('SignUp');
  };

  const checkClipboardPermission = async () => {
    try {
      // Check if we've already shown the permission alert
      const hasShownAlert = await AsyncStorage.getItem('clipboard_permission_shown');
      
      if (hasShownAlert === 'true') {
        return; // Already shown, don't show again
      }

      // Small delay to ensure login UI is complete
      setTimeout(async () => {
        try {
          // Test clipboard functionality by writing and reading
          const testText = 'clipboard_test_' + Date.now();
          await Clipboard.setString(testText);
          
          // Try to read it back
          const clipboardText = await Clipboard.getString();
          
          // Check if clipboard is accessible
          // On Android 10+, clipboard might be restricted
          if (clipboardText === testText || clipboardText !== '') {
            // Clipboard is working - mark as shown
            await AsyncStorage.setItem('clipboard_permission_shown', 'true');
          } else {
            // Clipboard might be restricted - show info
            await showClipboardPermissionAlert();
          }
        } catch (error) {
          // Clipboard access might be restricted
          console.error('Clipboard permission check error:', error);
          await showClipboardPermissionAlert();
        }
      }, 500);
    } catch (error) {
      console.error('Error checking clipboard permission:', error);
    }
  };

  const showClipboardPermissionAlert = async () => {
    // Mark as shown so we don't spam the user
    await AsyncStorage.setItem('clipboard_permission_shown', 'true');
    
    // Show permission alert
    Alert.alert(
      '📋 Clipboard Permission',
      'This app automatically copies your notes to the clipboard for easy sharing. ' +
      (Platform.OS === 'android' 
        ? 'On Android 10+, clipboard access may be restricted. Please ensure clipboard access is enabled in your device settings.'
        : 'Please ensure clipboard access is enabled in your device settings.'),
      [
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:').catch(() => {
                Alert.alert('Error', 'Unable to open settings');
              });
            } else {
              Linking.openSettings().catch(() => {
                Alert.alert('Error', 'Unable to open settings');
              });
            }
          },
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUpPress} disabled={loading}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 52,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#6b7280',
    letterSpacing: 0.2,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
    color: '#6b7280',
    letterSpacing: 0.2,
  },
  linkText: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default LoginScreen;

