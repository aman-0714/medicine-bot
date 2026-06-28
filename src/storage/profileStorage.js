import { Platform } from 'react-native';
import { STORAGE_KEYS, MAX_SCAN_HISTORY } from '../constants';

export const defaultProfile = {
  name: '',
  bloodGroup: '',
  drugAllergies: [],
  foodAllergies: [],
  environmentalAllergies: [],
  medications: [],
  conditions: [],
  emergencyContacts: [],
  insuranceDetails: '',
};

async function getStore() {
  if (Platform.OS === 'web') return null;
  const mod = await import('expo-secure-store');
  return mod;
}

// ── Profile ───────────────────────────────────────────────────────────────────
export async function saveProfile(profile) {
  try {
    const data = JSON.stringify(profile);
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEYS.PROFILE, data);
    } else {
      const SecureStore = await getStore();
      await SecureStore.setItemAsync(STORAGE_KEYS.PROFILE, data);
    }
    return true;
  } catch (e) {
    console.error('Failed to save profile:', e);
    return false;
  }
}

export async function loadProfile() {
  try {
    let data;
    if (Platform.OS === 'web') {
      data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    } else {
      const SecureStore = await getStore();
      data = await SecureStore.getItemAsync(STORAGE_KEYS.PROFILE);
    }
    if (data) return { ...defaultProfile, ...JSON.parse(data) };
    return defaultProfile;
  } catch (e) {
    console.error('Failed to load profile:', e);
    return defaultProfile;
  }
}

export async function clearProfile() {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    } else {
      const SecureStore = await getStore();
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PROFILE);
    }
    return true;
  } catch (e) {
    return false;
  }
}

// ── Scan history ──────────────────────────────────────────────────────────────
function historyStorage() {
  // Scan history is not sensitive — use AsyncStorage on native, localStorage on web.
  return Platform.OS === 'web' ? null : import('@react-native-async-storage/async-storage').then(m => m.default);
}

export async function loadScanHistory() {
  try {
    let raw;
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
    } else {
      const AsyncStorage = await historyStorage();
      raw = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function appendScanHistory(entry) {
  try {
    const history = await loadScanHistory();
    const updated = [entry, ...history].slice(0, MAX_SCAN_HISTORY);
    const data = JSON.stringify(updated);
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, data);
    } else {
      const AsyncStorage = await historyStorage();
      await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, data);
    }
    return true;
  } catch (e) {
    console.error('Failed to save scan history:', e);
    return false;
  }
}

export async function clearScanHistory() {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(STORAGE_KEYS.SCAN_HISTORY);
    } else {
      const AsyncStorage = await historyStorage();
      await AsyncStorage.removeItem(STORAGE_KEYS.SCAN_HISTORY);
    }
    return true;
  } catch {
    return false;
  }
}
