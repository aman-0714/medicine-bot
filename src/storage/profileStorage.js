import * as SecureStore from 'expo-secure-store';

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

export async function saveProfile(profile) {
  try {
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch (e) {
    console.error('Failed to save profile:', e);
    return false;
  }
}

export async function loadProfile() {
  try {
    const data = await SecureStore.getItemAsync(PROFILE_KEY);
    if (data) return JSON.parse(data);
    return defaultProfile;
  } catch (e) {
    console.error('Failed to load profile:', e);
    return defaultProfile;
  }
}

export async function clearProfile() {
  try {
    await SecureStore.deleteItemAsync(PROFILE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
