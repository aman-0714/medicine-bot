import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Platform,
} from 'react-native';
import { loadProfile, appendScanHistory } from '../storage/profileStorage';
import { checkAllergens } from '../utils/allergenChecker';
import { AlertCard, SafeBanner } from '../components/AlertCard';
import { API_URL } from '../constants';

export default function ScanScreen({ navigation }) {
  const [scanning, setScanning]       = useState(false);
  const [result, setResult]           = useState(null);
  const [profile, setProfile]         = useState(null);
  const [CameraView, setCameraView]   = useState(null);
  const [permission, setPermission]   = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    loadProfile().then(setProfile);

    if (Platform.OS !== 'web') {
      import('expo-camera').then((mod) => {
        setCameraView(() => mod.CameraView);
        // Correct API for expo-camera v15: requestCameraPermissionsAsync
        mod.Camera.requestCameraPermissionsAsync().then(setPermission);
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
      Alert.alert('Profile incomplete', 'Add your allergies and medications in the Profile tab first.');
      return;
    }
    if (Platform.OS === 'web') {
      Alert.alert('Camera not available', 'Camera scanning is only available on the mobile app.');
      return;
    }
    if (!cameraRef.current) return;

    setScanning(true);
    setResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });

      const response = await fetch(`${API_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photo.base64,
          mediaType: 'image/jpeg',
          profile,  // send profile so server can do AI analysis
        }),
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const data = await response.json();
      const extractedText = data.extractedText || '';
      const aiAnalysis    = data.aiAnalysis || null;

      if (!extractedText || extractedText === 'NO_TEXT') {
        setResult({ noText: true });
      } else {
        const keywordAnalysis = checkAllergens(extractedText, profile);
        const scanEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          extractedText,
          warnings: keywordAnalysis.warnings,
          safe: keywordAnalysis.safe,
          aiSummary: aiAnalysis,
        };
        await appendScanHistory(scanEntry);
        setResult({ analysis: keywordAnalysis, extractedText, aiAnalysis });
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Scan failed', 'Could not analyse the image. Check your internet connection.');
    } finally {
      setScanning(false);
    }
  }

  function reset() { setResult(null); }

  if (Platform.OS === 'web') return <WebScanFallback profile={profile} />;

  if (!CameraView) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;
  }

  if (permission && !permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is needed to scan labels</Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={() => import('expo-camera').then(m => m.Camera.requestCameraPermissionsAsync().then(setPermission))}
        >
          <Text style={styles.permBtnText}>Allow camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (result) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.resultContent}>
        {/* Result summary banner */}
        <View style={[styles.summaryBanner, result.analysis?.safe ? styles.bannerSafe : styles.bannerDanger]}>
          <Text style={styles.summaryIcon}>{result.noText ? '❓' : result.analysis?.safe ? '✅' : '🚨'}</Text>
          <View>
            <Text style={styles.summaryTitle}>
              {result.noText ? 'Could not read label' : result.analysis?.safe ? 'Looks safe' : 'Allergen detected'}
            </Text>
            {!result.noText && (
              <Text style={styles.summaryCount}>
                {result.analysis?.safe
                  ? 'No issues found based on your profile'
                  : `${result.analysis?.warnings.length} issue${result.analysis?.warnings.length > 1 ? 's' : ''} found`}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Automated check only — always read the label yourself. Translated names and trace warnings may be missed.
          </Text>
        </View>

        {result.noText && (
          <AlertCard severity="warning" message="No text found. Try better lighting or move closer." />
        )}

        {result.analysis && !result.analysis.safe &&
          result.analysis.warnings.map((w, i) => (
            <AlertCard key={i} severity={w.severity} message={w.message} allergen={w.allergen} />
          ))
        }
        {result.analysis?.safe && <SafeBanner />}

        {/* AI analysis summary */}
        {result.aiAnalysis && (
          <View style={styles.aiBox}>
            <Text style={styles.aiLabel}>🤖 AI analysis</Text>
            <Text style={styles.aiText}>{result.aiAnalysis}</Text>
          </View>
        )}

        {result.extractedText && (
          <View style={styles.extractedBox}>
            <Text style={styles.extractedLabel}>Text found on label</Text>
            <Text style={styles.extractedText}>{result.extractedText}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.scanAgainBtn} onPress={reset}>
          <Text style={styles.scanAgainText}>Scan another</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

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
                  borderLeftWidth:  pos.endsWith('R') ? 0 : 3,
                  borderBottomWidth: pos.startsWith('T') ? 0 : 3,
                  borderTopWidth:    pos.startsWith('B') ? 0 : 3,
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

// ── Web fallback ──────────────────────────────────────────────────────────────
function WebScanFallback({ profile }) {
  const [text, setText]     = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCheck() {
    if (!text.trim()) return;
    if (!profile) { alert('Fill in your health profile first.'); return; }
    setLoading(true);
    const analysis = checkAllergens(text, profile);

    // Try AI analysis via backend
    let aiAnalysis = null;
    try {
      const res = await fetch(`${API_URL}/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, profile }),
      });
      if (res.ok) {
        const d = await res.json();
        aiAnalysis = d.summary || null;
      }
    } catch { /* AI analysis is best-effort */ }

    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      extractedText: text,
      warnings: analysis.warnings,
      safe: analysis.safe,
      aiSummary: aiAnalysis,
    };
    await appendScanHistory(entry);
    setResult({ analysis, extractedText: text, aiAnalysis });
    setLoading(false);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.resultContent}>
      <Text style={styles.resultTitle}>Check ingredients</Text>
      <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 16, lineHeight: 20 }}>
        Camera scanning works on the mobile app. On web, paste the ingredient list below.
      </Text>

      <View style={styles.webTextBox}>
        <textarea
          style={{
            width: '100%', minHeight: 140, fontSize: 14, padding: 12,
            borderRadius: 10, border: '1.5px solid #E5E7EB', fontFamily: 'inherit',
            resize: 'vertical', boxSizing: 'border-box', color: '#111',
            outline: 'none', lineHeight: 1.6,
          }}
          placeholder="Paste ingredient list here — e.g. Water, Wheat flour, Milk solids, Peanut oil…"
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); }}
        />
      </View>

      <TouchableOpacity
        style={[styles.scanAgainBtn, { marginTop: 12, opacity: loading ? 0.6 : 1 }]}
        onPress={handleCheck}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.scanAgainText}>Check for allergens</Text>}
      </TouchableOpacity>

      {result && (
        <View style={{ marginTop: 20 }}>
          {/* Summary banner */}
          <View style={[styles.summaryBanner, result.analysis.safe ? styles.bannerSafe : styles.bannerDanger]}>
            <Text style={styles.summaryIcon}>{result.analysis.safe ? '✅' : '🚨'}</Text>
            <View>
              <Text style={styles.summaryTitle}>{result.analysis.safe ? 'Looks safe' : 'Allergen detected'}</Text>
              <Text style={styles.summaryCount}>
                {result.analysis.safe
                  ? 'No issues found based on your profile'
                  : `${result.analysis.warnings.length} issue${result.analysis.warnings.length > 1 ? 's' : ''} found`}
              </Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>Automated keyword check only — always read the label yourself.</Text>
          </View>

          {result.analysis.safe ? (
            <SafeBanner />
          ) : (
            result.analysis.warnings.map((w, i) => (
              <AlertCard key={i} severity={w.severity} message={w.message} allergen={w.allergen} />
            ))
          )}

          {result.aiAnalysis && (
            <View style={styles.aiBox}>
              <Text style={styles.aiLabel}>🤖 AI analysis</Text>
              <Text style={styles.aiText}>{result.aiAnalysis}</Text>
            </View>
          )}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: Platform.OS === 'web' ? '#F9FAFB' : '#000' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F9FAFB' },
  permText:        { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 20 },
  permBtn:         { backgroundColor: '#6366F1', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint:            { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  scanBtn:         { backgroundColor: '#6366F1', borderRadius: 50, paddingHorizontal: 40, paddingVertical: 16, minWidth: 160, alignItems: 'center' },
  scanBtnDisabled: { opacity: 0.6 },
  scanBtnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultContent:   { padding: 20 },
  resultTitle:     { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 16 },
  // Summary banner
  summaryBanner:   { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1 },
  bannerSafe:      { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  bannerDanger:    { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  summaryIcon:     { fontSize: 32 },
  summaryTitle:    { fontSize: 17, fontWeight: '700', color: '#111' },
  summaryCount:    { fontSize: 13, color: '#6B7280', marginTop: 2 },
  // Disclaimer
  disclaimer:      { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  disclaimerText:  { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  // AI box
  aiBox:           { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#C7D2FE' },
  aiLabel:         { fontSize: 12, fontWeight: '700', color: '#3730A3', textTransform: 'uppercase', marginBottom: 6 },
  aiText:          { fontSize: 13, color: '#1e1b4b', lineHeight: 20 },
  // Extracted text
  extractedBox:    { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, marginTop: 16 },
  extractedLabel:  { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' },
  extractedText:   { fontSize: 13, color: '#374151', lineHeight: 20 },
  scanAgainBtn:    { backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  scanAgainText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  webTextBox:      { width: '100%' },
});
