import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { loadProfile, saveProfile } from '../storage/profileStorage';
import TagInput from '../components/TagInput';

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  function update(key, value) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const ok = await saveProfile(profile);
    setSaving(false);
    Alert.alert(ok ? 'Saved' : 'Error', ok ? 'Your health profile is saved securely.' : 'Could not save. Try again.');
  }

  if (!profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Your Health Profile</Text>
      <Text style={styles.subheading}>Stored securely on this device only</Text>

      {/* Name */}
      <Text style={styles.label}>Full name</Text>
      <TextInput
        style={styles.input}
        value={profile.name}
        onChangeText={(v) => update('name', v)}
        placeholder="Your name"
        placeholderTextColor="#aaa"
      />

      {/* Blood group */}
      <Text style={styles.label}>Blood group</Text>
      <View style={styles.bloodRow}>
        {BLOOD_GROUPS.map((bg) => (
          <TouchableOpacity
            key={bg}
            style={[styles.bloodBtn, profile.bloodGroup === bg && styles.bloodBtnActive]}
            onPress={() => update('bloodGroup', bg)}
          >
            <Text style={[styles.bloodText, profile.bloodGroup === bg && styles.bloodTextActive]}>{bg}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Allergies */}
      <TagInput
        label="Drug allergies"
        values={profile.drugAllergies}
        onChange={(v) => update('drugAllergies', v)}
        placeholder="e.g. Penicillin, NSAIDs..."
      />
      <TagInput
        label="Food allergies"
        values={profile.foodAllergies}
        onChange={(v) => update('foodAllergies', v)}
        placeholder="e.g. Peanuts, Milk..."
      />
      <TagInput
        label="Environmental allergies"
        values={profile.environmentalAllergies}
        onChange={(v) => update('environmentalAllergies', v)}
        placeholder="e.g. Pollen, Dust..."
      />

      {/* Medications */}
      <TagInput
        label="Current medications"
        values={profile.medications}
        onChange={(v) => update('medications', v)}
        placeholder="e.g. Metformin, Lisinopril..."
      />

      {/* Conditions */}
      <TagInput
        label="Medical conditions"
        values={profile.conditions}
        onChange={(v) => update('conditions', v)}
        placeholder="e.g. Diabetes, Asthma..."
      />

      {/* Emergency contacts */}
      <TagInput
        label="Emergency contacts"
        values={profile.emergencyContacts}
        onChange={(v) => update('emergencyContacts', v)}
        placeholder="e.g. Mom: +91 98765 43210"
      />

      {/* Insurance */}
      <Text style={styles.label}>Health insurance details</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={profile.insuranceDetails}
        onChangeText={(v) => update('insuranceDetails', v)}
        placeholder="Policy number, provider name..."
        placeholderTextColor="#aaa"
        multiline
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save profile</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 4 },
  subheading: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  bloodBtn: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  bloodBtnActive: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  bloodText: { fontSize: 14, color: '#555', fontWeight: '500' },
  bloodTextActive: { color: '#4338CA', fontWeight: '700' },
  saveBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
