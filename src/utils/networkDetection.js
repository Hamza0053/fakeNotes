import { supabase } from '../supabase';

let isOnline = true;
let listeners = [];
let lastCheckTime = 0;
const CHECK_INTERVAL = 5000; // Check every 5 seconds

// Check network connectivity by attempting a lightweight Supabase request
const checkConnectivity = async () => {
  try {
    // Use Promise.race to implement timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000); // Increased timeout
    });
    
    // Try a simple query to check connectivity
    const queryPromise = supabase
      .from('notes_data')
      .select('id')
      .limit(1);
    
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    // If we get a result (even with error), we're connected to the internet
    // Only return false if it's a network error (no connection at all)
    if (result && result.error) {
      // Check if it's a network error or just a data/permission error
      const errorCode = result.error.code;
      // Network errors typically have codes like 'PGRST116' or are connection errors
      if (errorCode && (errorCode.includes('network') || errorCode.includes('connection') || errorCode === 'PGRST116')) {
        return false;
      }
      // Other errors (permissions, etc.) mean we're online
      return true;
    }
    
    return true; // If we got a response, we're online
  } catch (error) {
    // Network error or timeout - assume offline
    console.log('Network check failed:', error.message);
    return false;
  }
};

// Initialize network state
export const initNetworkDetection = async () => {
  isOnline = await checkConnectivity();
  lastCheckTime = Date.now();
  
  // Periodically check network state
  setInterval(async () => {
    const wasOnline = isOnline;
    isOnline = await checkConnectivity();
    lastCheckTime = Date.now();
    
    // Notify all listeners if state changed
    if (wasOnline !== isOnline) {
      listeners.forEach(listener => listener(isOnline));
    }
  }, CHECK_INTERVAL);
};

// Check if currently online (with caching)
export const isOnlineNow = async () => {
  const now = Date.now();
  // If last check was recent, use cached value
  if (now - lastCheckTime < CHECK_INTERVAL / 2) {
    return isOnline;
  }
  // Otherwise, check again
  isOnline = await checkConnectivity();
  lastCheckTime = now;
  return isOnline;
};

// Subscribe to network state changes
export const subscribeToNetworkChanges = (callback) => {
  listeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(listener => listener !== callback);
  };
};

// Get current network state
export const getNetworkState = async () => {
  const online = await isOnlineNow();
  return {
    isConnected: online,
    isInternetReachable: online,
  };
};

