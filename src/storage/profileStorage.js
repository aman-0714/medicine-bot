import { Platform } from 'react-native';

const PROFILE_KEY = 'health_profile';

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

// On web, expo-secure-store is unavailable — fall back to localStorage.
// On native, use SecureStore (encrypted, sandboxed).
async function getStore() {
  if (Platform.OS === 'web') return null;
  const mod = await import('expo-secure-store');
  return mod;
}

export async function saveProfile(profile) {
  try {
    const data = JSON.stringify(profile);
    if (Platform.OS === 'web') {
      localStorage.setItem(PROFILE_KEY, data);
    } else {
      const SecureStore = await getStore();
      await SecureStore.setItemAsync(PROFILE_KEY, data);
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
      data = localStorage.getItem(PROFILE_KEY);
    } else {
      const SecureStore = await getStore();
      data = await SecureStore.getItemAsync(PROFILE_KEY);
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
      localStorage.removeItem(PROFILE_KEY);
    } else {
      const SecureStore = await getStore();
      await SecureStore.deleteItemAsync(PROFILE_KEY);
    }
    return true;
  } catch (e) {
    return false;
  }
}
