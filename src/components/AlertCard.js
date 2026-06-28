import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Severity drives color: 'danger' (allergy match) is red, 'warning'
// (e.g. duplicate medication, unreadable label) is amber.
const SEVERITY_STYLES = {
  danger: {
    bg: '#FEF2F2',
    border: '#FECACA',
    icon: '⚠️',
    titleColor: '#991B1B',
    textColor: '#B91C1C',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: 'ℹ️',
    titleColor: '#92400E',
    textColor: '#B45309',
  },
};

export function AlertCard({ severity = 'warning', message, allergen }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.warning;

  return (
    <View style={[styles.card, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={styles.icon}>{s.icon}</Text>
      <View style={styles.textCol}>
        {allergen ? (
          <Text style={[styles.title, { color: s.titleColor }]}>{allergen}</Text>
        ) : null}
        <Text style={[styles.message, { color: s.textColor }]}>{message}</Text>
      </View>
    </View>
  );
}

export function SafeBanner() {
  return (
    <View style={[styles.card, styles.safeCard]}>
      <Text style={styles.icon}>✅</Text>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: '#166534' }]}>Looks safe</Text>
        <Text style={[styles.message, { color: '#15803D' }]}>
          No known allergens detected based on your profile.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  safeCard: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  icon: { fontSize: 18, marginTop: 1 },
  textCol: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  message: { fontSize: 13, lineHeight: 18 },
});
