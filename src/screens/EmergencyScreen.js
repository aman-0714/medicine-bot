import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { loadProfile } from '../storage/profileStorage';

export default function EmergencyScreen() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  if (!profile) return null;

  const emergencyData = JSON.stringify({
    name: profile.name,
    bloodGroup: profile.bloodGroup,
    drugAllergies: profile.drugAllergies,
    foodAllergies: profile.foodAllergies,
    medications: profile.medications,
    conditions: profile.conditions,
    emergencyContacts: profile.emergencyContacts,
  });

  const hasData = profile.bloodGroup || profile.drugAllergies.length > 0 || profile.conditions.length > 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🚑</Text>
        <Text style={styles.heading}>Emergency card</Text>
        <Text style={styles.subheading}>Show this to first responders</Text>
      </View>

      {!hasData ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Your profile is empty. Fill in your health profile first.</Text>
        </View>
      ) : (
        <>
          {/* Quick-read summary */}
          <View style={styles.summaryBox}>
            {profile.name ? <Row label="Name" value={profile.name} /> : null}
            {profile.bloodGroup ? <Row label="Blood group" value={profile.bloodGroup} critical /> : null}
            {profile.drugAllergies.length > 0 && (
              <Row label="Drug allergies" value={profile.drugAllergies.join(', ')} critical />
            )}
            {profile.foodAllergies.length > 0 && (
              <Row label="Food allergies" value={profile.foodAllergies.join(', ')} />
            )}
            {profile.medications.length > 0 && (
              <Row label="Current medications" value={profile.medications.join(', ')} />
            )}
            {profile.conditions.length > 0 && (
              <Row label="Medical conditions" value={profile.conditions.join(', ')} />
            )}
            {profile.emergencyContacts.length > 0 && (
              <Row label="Emergency contacts" value={profile.emergencyContacts.join('\n')} />
            )}
          </View>

          {/* QR Code */}
          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>Scan QR for full emergency profile</Text>
            <View style={styles.qrBox}>
              <QRCode value={emergencyData} size={200} />
            </View>
            <Text style={styles.qrNote}>
              Contains only emergency-relevant data. No insurance info shared.
            </Text>
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Row({ label, value, critical }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, critical && styles.rowValueCritical]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  headerIcon: { fontSize: 40, marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: '700', color: '#111' },
  subheading: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  emptyBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  emptyText: { color: '#92400E', fontSize: 14, textAlign: 'center' },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  rowLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', flex: 1 },
  rowValue: { fontSize: 13, color: '#111', flex: 2, textAlign: 'right' },
  rowValueCritical: { color: '#DC2626', fontWeight: '700' },
  qrSection: { alignItems: 'center', gap: 12 },
  qrLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  qrBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrNote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20 },
});
