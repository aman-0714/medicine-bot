import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  FlatList, Alert,
} from 'react-native';
import { loadScanHistory, clearScanHistory } from '../storage/profileStorage';

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const reload = useCallback(() => {
    loadScanHistory().then(setHistory);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  function handleClear() {
    Alert.alert(
      'Clear history',
      'This will delete all your scan records. Your health profile is not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all', style: 'destructive',
          onPress: () => clearScanHistory().then(reload),
        },
      ]
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>No scans yet</Text>
        <Text style={styles.emptyDesc}>
          Your scan history will appear here after you check a label or ingredient list.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerCount}>{history.length} scan{history.length !== 1 ? 's' : ''}</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearBtn}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isOpen = expanded === item.id;
          const safe   = item.safe;
          return (
            <TouchableOpacity
              style={[styles.card, safe ? styles.cardSafe : styles.cardDanger]}
              onPress={() => setExpanded(isOpen ? null : item.id)}
              activeOpacity={0.85}
            >
              {/* Row 1: icon + summary + time */}
              <View style={styles.cardRow}>
                <Text style={styles.cardIcon}>{safe ? '✅' : '🚨'}</Text>
                <View style={styles.cardMid}>
                  <Text style={[styles.cardStatus, safe ? styles.colorSafe : styles.colorDanger]}>
                    {safe ? 'Safe' : `${item.warnings?.length || 1} issue${(item.warnings?.length || 1) > 1 ? 's' : ''} found`}
                  </Text>
                  <Text style={styles.cardPreview} numberOfLines={1}>
                    {item.extractedText?.slice(0, 60) || 'No text'}…
                  </Text>
                </View>
                <Text style={styles.cardTime}>{timeAgo(item.timestamp)}</Text>
              </View>

              {/* Expanded detail */}
              {isOpen && (
                <View style={styles.cardDetail}>
                  {item.warnings?.length > 0 && (
                    <View style={styles.warningsBox}>
                      {item.warnings.map((w, i) => (
                        <Text key={i} style={styles.warningItem}>
                          ⚠️ {w.message}
                        </Text>
                      ))}
                    </View>
                  )}
                  {item.aiSummary && (
                    <View style={styles.aiBox}>
                      <Text style={styles.aiLabel}>🤖 AI analysis</Text>
                      <Text style={styles.aiText}>{item.aiSummary}</Text>
                    </View>
                  )}
                  <View style={styles.extractedBox}>
                    <Text style={styles.extractedLabel}>Label text</Text>
                    <Text style={styles.extractedText}>{item.extractedText}</Text>
                  </View>
                  <Text style={styles.fullDate}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#F9FAFB' },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#F9FAFB' },
  emptyIcon:    { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  emptyDesc:    { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff' },
  headerCount:  { fontSize: 15, fontWeight: '700', color: '#111' },
  clearBtn:     { fontSize: 14, color: '#DC2626', fontWeight: '600' },
  list:         { padding: 16, gap: 10 },
  card:         { borderRadius: 14, borderWidth: 1, padding: 14, backgroundColor: '#fff' },
  cardSafe:     { borderColor: '#BBF7D0' },
  cardDanger:   { borderColor: '#FECACA' },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon:     { fontSize: 24, flexShrink: 0 },
  cardMid:      { flex: 1 },
  cardStatus:   { fontSize: 14, fontWeight: '700' },
  colorSafe:    { color: '#166534' },
  colorDanger:  { color: '#991B1B' },
  cardPreview:  { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardTime:     { fontSize: 12, color: '#9CA3AF', flexShrink: 0 },
  cardDetail:   { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, gap: 10 },
  warningsBox:  { gap: 6 },
  warningItem:  { fontSize: 13, color: '#B91C1C', lineHeight: 18 },
  aiBox:        { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#C7D2FE' },
  aiLabel:      { fontSize: 11, fontWeight: '700', color: '#3730A3', textTransform: 'uppercase', marginBottom: 5 },
  aiText:       { fontSize: 13, color: '#1e1b4b', lineHeight: 19 },
  extractedBox: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12 },
  extractedLabel:{ fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', marginBottom: 5 },
  extractedText: { fontSize: 13, color: '#374151', lineHeight: 19 },
  fullDate:     { fontSize: 11, color: '#9CA3AF', textAlign: 'right' },
});
