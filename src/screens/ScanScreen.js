import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform,
} from 'react-native';
import { loadProfile } from '../storage/profileStorage';
import { checkAllergens } from '../utils/allergenChecker';
import { AlertCard, SafeBanner } from '../components/AlertCard';

const SCAN_API_URL = 'http://localhost:3000';

export default function ScanScreen({ navigation }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [profile, setProfile] = useState(null);
  const [CameraView, setCameraView] = useState(null);
  const [permission, setPermission] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    loadProfile().then(setProfile);

    // Only load camera on native — expo-camera crashes on web
    if (Platform.OS !== 'web') {
      import('expo-camera').then((mod) => {
        setCameraView(() => mod.CameraView);
        mod.useCameraPermissions && mod.Camera.requestCameraPermissionsAsync().then(setPermission);
      });
    }
  }, []);

  async function handleScan() {
    if (!profile) {
      Alert.alert('No profile', 'Please fill in your health profile first.');
      return;
    }

    const hasAllergies =
      profile.foodAllergies.length > 0 ||
      profile.drugAllergies.length > 0 ||
      profile.medications.length > 0;

    if (!hasAllergies) {
      Alert.alert('Profile incomplete', 'Add your allergies and medications in the Profile tab so I can check for you.');
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert('Camera not available', 'Camera scanning is only available on the mobile app. On web, please type ingredients manually.');
      return;
    }

    if (!cameraRef.current) return;

    setScanning(true);
    setResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });

      const response = await fetch(`${SCAN_API_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photo.base64, mediaType: 'image/jpeg' }),
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const data = await response.json();
      const extractedText = data.extractedText || '';

      if (!extractedText || extractedText === 'NO_TEXT') {
        setResult({ noText: true });
      } else {
        const analysis = checkAllergens(extractedText, profile);
        setResult({ analysis, extractedText });
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Scan failed', 'Could not analyse the image. Check that the server is running.');
    } finally {
      setScanning(false);
    }
  }

  function reset() {
    setResult(null);
  }

  // ── Web fallback UI ──────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return <WebScanFallback profile={profile} />;
  }

  // ── Native: waiting for camera module to load ────────────────────
  if (!CameraView) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;
  }

  if (permission && !permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is needed to scan labels</Text>
        <TouchableOpacity style={styles.permBtn} onPress={() => import('expo-camera').then(m => m.Camera.requestCameraPermissionsAsync().then(setPermission))}>
          <Text style={styles.permBtnText}>Allow camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Result view ──────────────────────────────────────────────────
  if (result) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.resultContent}>
        <Text style={styles.resultTitle}>Scan result</Text>
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This is an automated check and can miss allergens — translated labels,
            unusual ingredient names, and "may contain traces of" warnings aren't
            always caught. Always read the label yourself too.
          </Text>
        </View>
        {result.noText && (
          <AlertCard severity="warning" message="Could not read any text from the image. Try better lighting or move closer." />
        )}
        {result.analysis && (
          <>
            {result.analysis.safe ? (
              <SafeBanner />
            ) : (
              result.analysis.warnings.map((w, i) => (
                <AlertCard key={i} severity={w.severity} message={w.message} allergen={w.allergen} />
              ))
            )}
            <View style={styles.extractedBox}>
              <Text style={styles.extractedLabel}>Text found on label</Text>
              <Text style={styles.extractedText}>{result.extractedText}</Text>
            </View>
          </>
        )}
        <TouchableOpacity style={styles.scanAgainBtn} onPress={reset}>
          <Text style={styles.scanAgainText}>Scan another</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ── Camera view ──────────────────────────────────────────────────
  const VIEWFINDER = 260;
  const CORNER = 20;

  return (
    <View style={styles.screen}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          <View style={{ flexDirection: 'row', height: VIEWFINDER }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
            <View style={{ width: VIEWFINDER, height: VIEWFINDER, position: 'relative' }}>
              {[['TL',{top:0,left:0}],['TR',{top:0,right:0}],['BL',{bottom:0,left:0}],['BR',{bottom:0,right:0}]].map(([pos, coords]) => (
                <View key={pos} style={[{
                  position:'absolute', width:CORNER, height:CORNER,
                  borderColor:'#fff', borderWidth:3,
                  borderRightWidth: pos.endsWith('L') ? 0 : 3,
                  borderLeftWidth: pos.endsWith('R') ? 0 : 3,
                  borderBottomWidth: pos.startsWith('T') ? 0 : 3,
                  borderTopWidth: pos.startsWith('B') ? 0 : 3,
                }, coords]} />
              ))}
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems:'center', justifyContent:'center', gap:16, paddingTop:20 }}>
            <Text style={styles.hint}>Point at a food label, medicine box, or menu</Text>
            <TouchableOpacity style={[styles.scanBtn, scanning && styles.scanBtnDisabled]} onPress={handleScan} disabled={scanning}>
              {scanning ? <ActivityIndicator color="#fff" /> : <Text style={styles.scanBtnText}>Scan now</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

// ── Web fallback: manual ingredient text check ───────────────────────────────
function WebScanFallback({ profile }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  function handleCheck() {
    if (!text.trim()) return;
    if (!profile) { alert('Fill in your health profile first.'); return; }
    const analysis = checkAllergens(text, profile);
    setResult({ analysis, extractedText: text });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.resultContent}>
      <Text style={styles.resultTitle}>Check ingredients</Text>
      <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 16 }}>
        Camera scanning works on the mobile app. On web, paste or type the ingredient list below.
      </Text>

      <View style={styles.webTextBox}>
        <textarea
          style={{
            width: '100%', minHeight: 140, fontSize: 14, padding: 12,
            borderRadius: 10, border: '1px solid #E5E7EB', fontFamily: 'inherit',
            resize: 'vertical', boxSizing: 'border-box', color: '#111',
          }}
          placeholder="Paste ingredient list here…"
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); }}
        />
      </View>

      <TouchableOpacity style={[styles.scanAgainBtn, { marginTop: 12 }]} onPress={handleCheck}>
        <Text style={styles.scanAgainText}>Check for allergens</Text>
      </TouchableOpacity>

      {result && (
        <View style={{ marginTop: 20 }}>
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Automated keyword check only — always read the label yourself.
            </Text>
          </View>
          {result.analysis.safe ? (
            <SafeBanner />
          ) : (
            result.analysis.warnings.map((w, i) => (
              <AlertCard key={i} severity={w.severity} message={w.message} allergen={w.allergen} />
            ))
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#F9FAFB' : '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F9FAFB' },
  permText: { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 20 },
  permBtn: { backgroundColor: '#6366F1', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  scanBtn: { backgroundColor: '#6366F1', borderRadius: 50, paddingHorizontal: 40, paddingVertical: 16, minWidth: 160, alignItems: 'center' },
  scanBtnDisabled: { opacity: 0.6 },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultContent: { padding: 20 },
  resultTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 16 },
  disclaimer: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  disclaimerText: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  extractedBox: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, marginTop: 16 },
  extractedLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' },
  extractedText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  scanAgainBtn: { backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  scanAgainText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  webTextBox: { width: '100%' },
});
