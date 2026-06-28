import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { loadProfile } from '../storage/profileStorage';

export default function HomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile().then(setProfile);
    });
    return unsubscribe;
  }, [navigation]);

  const isProfileComplete =
    profile && (profile.foodAllergies.length > 0 || profile.drugAllergies.length > 0 || profile.bloodGroup);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>MediScan</Text>
      <Text style={styles.tagline}>Your AI health guardian</Text>

      {!isProfileComplete && (
        <TouchableOpacity
          style={styles.setupBanner}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.setupBannerIcon}>⚡</Text>
          <View>
            <Text style={styles.setupBannerTitle}>Set up your health profile</Text>
            <Text style={styles.setupBannerSub}>Add your allergies so I can protect you</Text>
          </View>
        </TouchableOpacity>
      )}

      {isProfileComplete && (
        <View style={styles.profileSummary}>
          <Text style={styles.profileSummaryTitle}>
            {profile.name ? `Hello, ${profile.name.split(' ')[0]}` : 'Profile active'}
          </Text>
          {profile.bloodGroup ? (
            <Text style={styles.profileSummaryDetail}>Blood group: {profile.bloodGroup}</Text>
          ) : null}
          <Text style={styles.profileSummaryDetail}>
            {profile.foodAllergies.length + profile.drugAllergies.length} allerg{profile.foodAllergies.length + profile.drugAllergies.length === 1 ? 'y' : 'ies'} tracked
          </Text>
        </View>
      )}

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.actions}>
        <ActionCard
          icon="📷"
          title="Scan label"
          desc="Food, medicine or menu"
          onPress={() => navigation.navigate('Scan')}
          accent="#6366F1"
        />
        <ActionCard
          icon="🚑"
          title="Emergency card"
          desc="Show to first responders"
          onPress={() => navigation.navigate('Emergency')}
          accent="#DC2626"
        />
        <ActionCard
          icon="👤"
          title="Edit profile"
          desc="Update your health info"
          onPress={() => navigation.navigate('Profile')}
          accent="#0891B2"
        />
      </View>

      {/* How it works */}
      <Text style={styles.sectionTitle}>How it works</Text>
      <View style={styles.howItWorks}>
        <Step n="1" text="Fill in your allergies, medications and conditions in your profile" />
        <Step n="2" text="Point your camera at any food label, medicine box or menu" />
        <Step n="3" text="Get an instant warning if anything matches your profile" />
        <Step n="4" text="In an emergency, show the QR card — no unlock needed" />
      </View>
    </ScrollView>
  );
}

function ActionCard({ icon, title, desc, onPress, accent }) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionTitle, { color: accent }]}>{title}</Text>
      <Text style={styles.actionDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

function Step({ n, text }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  greeting: { fontSize: 30, fontWeight: '800', color: '#111', marginTop: 8 },
  tagline: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  setupBannerIcon: { fontSize: 24 },
  setupBannerTitle: { fontSize: 15, fontWeight: '700', color: '#3730A3' },
  setupBannerSub: { fontSize: 13, color: '#6366F1', marginTop: 2 },
  profileSummary: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  profileSummaryTitle: { fontSize: 15, fontWeight: '700', color: '#166534' },
  profileSummaryDetail: { fontSize: 13, color: '#15803D', marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: { fontSize: 28 },
  actionTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  actionDesc: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  howItWorks: { gap: 12, marginBottom: 24 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
});
