import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

// A labeled input that lets the user add multiple short values (allergies,
// medications, contacts, etc.) as removable pills. Backed by a plain string
// array — values / onChange(values) — so it drops straight into profile state.
export default function TagInput({ label, values = [], onChange, placeholder }) {
  const [draft, setDraft] = useState('');

  function addTag() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setDraft('');
      return; // no duplicates
    }
    onChange([...values, trimmed]);
    setDraft('');
  }

  function removeTag(index) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      {values.length > 0 && (
        <View style={styles.tagRow}>
          {values.map((tag, i) => (
            <View key={`${tag}-${i}`} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(i)} style={styles.tagRemove} hitSlop={8}>
                <Text style={styles.tagRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          onSubmitEditing={addTag}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.addBtn, !draft.trim() && styles.addBtnDisabled]}
          onPress={addTag}
          disabled={!draft.trim()}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 4,
  },
  tagText: { fontSize: 13, color: '#3730A3', fontWeight: '600' },
  tagRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRemoveText: { fontSize: 16, color: '#6366F1', lineHeight: 16 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
  },
  addBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#C7D2FE' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
