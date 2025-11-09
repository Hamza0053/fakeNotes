import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';

const CLIPBOARD_PERMISSION_KEY = 'clipboard_permission_granted';
const CLIPBOARD_PERMISSION_SHOWN_KEY = 'clipboard_permission_shown';

/**
 * Check if clipboard permission has been granted
 */

export const getClipboardPermission = async () => {
  try {
    const permission = await AsyncStorage.getItem(CLIPBOARD_PERMISSION_KEY);
    return permission === 'true';
  } catch (error) {
    console.error('Error getting clipboard permission:', error);
    return false;
  }
};

/**
 * Check if permission modal has been shown before
 */
export const hasShownPermissionModal = async () => {
  try {
    const shown = await AsyncStorage.getItem(CLIPBOARD_PERMISSION_SHOWN_KEY);
    console.log("this is shown in utils", shown);
    // If key doesn't exist (null), it's the first time - return false to show modal
    return shown === 'true';
  } catch (error) {
    console.error('Error checking permission modal status:', error);
    return false;
  }
};

/**
 * Initialize permission state on first app load
 * Returns true if this is the first time (should show modal), false otherwise
 */
export const initializePermissionOnFirstLoad = async () => {
  try {
    const shown = await AsyncStorage.getItem(CLIPBOARD_PERMISSION_SHOWN_KEY);
    const permission = await AsyncStorage.getItem(CLIPBOARD_PERMISSION_KEY);
    
    // If both keys don't exist, it's the first time
    if (shown === null && permission === null) {
      // Explicitly set permission to false on first load
      await AsyncStorage.setItem(CLIPBOARD_PERMISSION_KEY, 'false');
      return true; // Show modal
    }
    
    return false; // Don't show modal
  } catch (error) {
    console.error('Error initializing permission on first load:', error);
    // On error, assume first load and show modal
    return true;
  }
};

/**
 * Set clipboard permission status
 */
export const setClipboardPermission = async (granted) => {
  try {
    await AsyncStorage.setItem(CLIPBOARD_PERMISSION_KEY, granted ? 'true' : 'false');
    await AsyncStorage.setItem(CLIPBOARD_PERMISSION_SHOWN_KEY, 'true');
  } catch (error) {
    console.error('Error setting clipboard permission:', error);
  }
};

/**
 * Test clipboard functionality
 */
export const testClipboardAccess = async () => {
  try {
    const testText = 'clipboard_test_' + Date.now();
    await Clipboard.setString(testText);
    const clipboardText = await Clipboard.getString();
    // If we can read back what we wrote, clipboard is accessible
    return clipboardText === testText || clipboardText !== '';
  } catch (error) {
    console.error('Error testing clipboard access:', error);
    return false;
  }
};

/**
 * Copy text to clipboard if permission is granted
 */
export const copyToClipboardIfAllowed = async (text) => {
  try {
    const hasPermission = await getClipboardPermission();
    if (hasPermission && text && text.trim().length > 0) {
      await Clipboard.setString(text);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

