import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { loadProfile } from '../storage/profileStorage';
import { checkAllergens } from '../utils/allergenChecker';
import { AlertCard, SafeBanner } from '../components/AlertCard';

// Where our backend (server/index.js) is running.
// - iOS simulator: http://localhost:3000 works fine
// - Android emulator: use http://10.0.2.2:3000 (it can't see "localhost")
// - Physical phone via Expo Go: use your computer's LAN IP, e.g. http://192.168.1.50:3000
//   (phone and computer must be on the same Wi-Fi network)
const SCAN_API_URL = 'http://localhost:3000';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [profile, setProfile] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  async function handleScan() {
    if (!cameraRef.current) return;
    if (!profile) {
      Alert.alert('No profile', 'Please fill in your health profile first.');
      return;
    }

    const hasAllergies =
      profile.foodAllergies.length > 0 ||
      profile.drugAllergies.length > 0 ||
      profile.medications.length > 0;

    if (!hasAllergies) {
      Alert.alert(
        'Profile incomplete',
        'Add your allergies and medications in the Profile tab so I can check for you.'
      );
      return;
    }

    setScanning(true);
    setResult(null);

    try {
      // Take a photo
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });

      // Send to our backend, which holds the Anthropic API key server-side
      // and forwards the OCR request to Claude. Never call api.anthropic.com
      // directly from the app — that would mean shipping the key on-device,
      // where it can be extracted from the compiled app.
      const response = await fetch(`${SCAN_API_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photo.base64,
          mediaType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

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
      Alert.alert('Scan failed', 'Could not analyse the image. Check that the server is running and your internet connection.');
    } finally {
      setScanning(false);
    }
  }

  function reset() {
    setResult(null);
  }

  if (!permission) return <View style={styles.center}><ActivityIndicator /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is needed to scan labels</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (result) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.resultContent}>
        <Text style={styles.resultTitle}>Scan result</Text>

        {/* Always visible — the keyword matcher can miss things, so a clean
            result should never read as a medical guarantee. */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This is an automated check and can miss allergens — translated labels,
            unusual ingredient names, and "may contain traces of" warnings aren't
            always caught. Always read the label yourself too, and don't treat this
            as medical advice.
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

  return (
    <View style={styles.screen}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Viewfinder overlay */}
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.viewfinder}>
              {/* Corner marks */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Text style={styles.hint}>Point at a food label, medicine box, or menu</Text>
            <TouchableOpacity
              style={[styles.scanBtn, scanning && styles.scanBtnDisabled]}
              onPress={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.scanBtnText}>Scan now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const VIEWFINDER = 260;
const CORNER = 20;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F9FAFB' },
  permText: { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 20 },
  permBtn: { backgroundColor: '#6366F1', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  middleRow: { flexDirection: 'row', height: VIEWFINDER },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  viewfinder: { width: VIEWFINDER, height: VIEWFINDER, position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 20,
  },
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  scanBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 50,
    paddingHorizontal: 40,
    paddingVertical: 16,
    minWidth: 160,
    alignItems: 'center',
  },
  scanBtnDisabled: { opacity: 0.6 },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultContent: { padding: 20 },
  resultTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 16 },
  disclaimer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disclaimerText: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  extractedBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  extractedLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' },
  extractedText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  scanAgainBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  scanAgainText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
