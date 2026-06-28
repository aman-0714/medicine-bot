import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { loadProfile, loadScanHistory } from '../storage/profileStorage';

function timeAgo(isoString) {
  const diff  = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function HomeScreen({ navigation }) {
  const [profile, setProfile]         = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile().then(setProfile);
      loadScanHistory().then((h) => setRecentScans(h.slice(0, 3)));
    });
    return unsubscribe;
  }, [navigation]);

  const isProfileComplete =
    profile && (profile.foodAllergies.length > 0 || profile.drugAllergies.length > 0 || profile.bloodGroup);

  const totalAllergies = profile
    ? profile.foodAllergies.length + profile.drugAllergies.length
    : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.greeting}>
        {profile?.name ? `Hi, ${profile.name.split(' ')[0]} 👋` : 'MediScan'}
      </Text>
      <Text style={styles.tagline}>Your AI health guardian</Text>

      {/* Setup prompt */}
      {!isProfileComplete && (
        <TouchableOpacity
          style={styles.setupBanner}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.setupBannerIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.setupBannerTitle}>Set up your health profile</Text>
            <Text style={styles.setupBannerSub}>Add your allergies so I can protect you</Text>
          </View>
          <Text style={styles.setupArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Profile summary cards */}
      {isProfileComplete && (
        <View style={styles.statsRow}>
          <StatCard
            value={totalAllergies}
            label={totalAllergies === 1 ? 'Allergy' : 'Allergies'}
            color="#6366F1"
            bg="#EEF2FF"
          />
          {profile.bloodGroup ? (
            <StatCard value={profile.bloodGroup} label="Blood group" color="#DC2626" bg="#FEF2F2" />
          ) : (
            <StatCard value={profile.medications.length} label="Medications" color="#0891B2" bg="#E0F2FE" />
          )}
          <StatCard value={recentScans.length} label="Scans" color="#059669" bg="#F0FDF4" />
        </View>
      )}

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.actions}>
        <ActionCard icon="📷" title="Scan label"      desc="Food, medicine or menu"      onPress={() => navigation.navigate('Scan')}      accent="#6366F1" />
        <ActionCard icon="🕒" title="History"         desc="Your past scans"             onPress={() => navigation.navigate('History')}   accent="#059669" />
        <ActionCard icon="🚑" title="Emergency"       desc="Show to first responders"    onPress={() => navigation.navigate('Emergency')} accent="#DC2626" />
      </View>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent scans</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentList}>
            {recentScans.map((scan) => (
              <TouchableOpacity
                key={scan.id}
                style={[styles.recentCard, scan.safe ? styles.recentSafe : styles.recentDanger]}
                onPress={() => navigation.navigate('History')}
              >
                <Text style={styles.recentIcon}>{scan.safe ? '✅' : '🚨'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recentStatus, scan.safe ? styles.colorSafe : styles.colorDanger]}>
                    {scan.safe ? 'Safe' : `${scan.warnings?.length || 1} issue found`}
                  </Text>
                  <Text style={styles.recentPreview} numberOfLines={1}>
                    {scan.extractedText?.slice(0, 50) || 'No text'}…
                  </Text>
                </View>
                <Text style={styles.recentTime}>{timeAgo(scan.timestamp)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* How it works (only shown when no scans yet) */}
      {recentScans.length === 0 && (
        <>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.howItWorks}>
            <Step n="1" text="Fill in your allergies, medications and conditions in your profile" />
            <Step n="2" text="Point your camera at any food label, medicine box or menu" />
            <Step n="3" text="Get an instant warning if anything matches your profile" />
            <Step n="4" text="In an emergency, show the QR card — no unlock needed" />
          </View>
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function StatCard({ value, label, color, bg }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
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
  screen:   { flex: 1, backgroundColor: '#F9FAFB' },
  content:  { padding: 20 },
  greeting: { fontSize: 28, fontWeight: '800', color: '#111', marginTop: 8 },
  tagline:  { fontSize: 14, color: '#6B7280', marginBottom: 24 },

  setupBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF2FF', borderRadius: 14,
    padding: 16, marginBottom: 24, gap: 12,
    borderWidth: 1, borderColor: '#C7D2FE',
  },
  setupBannerIcon:  { fontSize: 24 },
  setupBannerTitle: { fontSize: 15, fontWeight: '700', color: '#3730A3' },
  setupBannerSub:   { fontSize: 13, color: '#6366F1', marginTop: 2 },
  setupArrow:       { fontSize: 22, color: '#6366F1', fontWeight: '300' },

  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard:   { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statValue:  { fontSize: 22, fontWeight: '800' },
  statLabel:  { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll:       { fontSize: 13, color: '#6366F1', fontWeight: '600' },

  actions:    { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#E5E7EB',
    alignItems: 'center', gap: 5,
  },
  actionIcon:  { fontSize: 26 },
  actionTitle: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  actionDesc:  { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },

  recentList:    { gap: 8, marginBottom: 24 },
  recentCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12, backgroundColor: '#fff' },
  recentSafe:    { borderColor: '#BBF7D0' },
  recentDanger:  { borderColor: '#FECACA' },
  recentIcon:    { fontSize: 20 },
  recentStatus:  { fontSize: 13, fontWeight: '700' },
  colorSafe:     { color: '#166534' },
  colorDanger:   { color: '#991B1B' },
  recentPreview: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  recentTime:    { fontSize: 11, color: '#9CA3AF' },

  howItWorks: { gap: 12, marginBottom: 24 },
  step:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum:    { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNumText:{ color: '#fff', fontSize: 13, fontWeight: '700' },
  stepText:   { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
});
