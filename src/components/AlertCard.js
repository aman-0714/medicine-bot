import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SEVERITY = {
  danger: {
    bg: '#FEF2F2', border: '#FECACA',
    icon: '🚨', titleColor: '#991B1B', textColor: '#B91C1C',
    label: 'Allergen alert',
  },
  warning: {
    bg: '#FFFBEB', border: '#FDE68A',
    icon: '⚠️', titleColor: '#92400E', textColor: '#B45309',
    label: 'Caution',
  },
};

export function AlertCard({ severity = 'warning', message, allergen }) {
  const s = SEVERITY[severity] || SEVERITY.warning;
  return (
    <View style={[styles.card, { backgroundColor: s.bg, borderColor: s.border }]}>
      <View style={[styles.iconBox, { backgroundColor: s.border }]}>
        <Text style={styles.icon}>{s.icon}</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: s.titleColor }]}>{s.label}</Text>
        {allergen && <Text style={[styles.title, { color: s.titleColor }]}>{allergen}</Text>}
        <Text style={[styles.message, { color: s.textColor }]}>{message}</Text>
      </View>
    </View>
  );
}

export function SafeBanner() {
  return (
    <View style={[styles.card, styles.safeCard]}>
      <View style={[styles.iconBox, { backgroundColor: '#BBF7D0' }]}>
        <Text style={styles.icon}>✅</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: '#166534' }]}>All clear</Text>
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
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, borderRadius: 14, borderWidth: 1,
    padding: 14, marginBottom: 10,
  },
  safeCard: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  iconBox:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:     { fontSize: 20 },
  textCol:  { flex: 1, gap: 2 },
  label:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title:    { fontSize: 15, fontWeight: '700' },
  message:  { fontSize: 13, lineHeight: 19 },
});
