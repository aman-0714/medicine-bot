import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          MediScan ran into an unexpected error. Your profile data is safe.
        </Text>
        {__DEV__ && this.state.error && (
          <View style={styles.devBox}>
            <Text style={styles.devText}>{this.state.error.toString()}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.btn} onPress={() => this.reset()}>
          <Text style={styles.btnText}>Try again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F9FAFB' },
  icon:    { fontSize: 48, marginBottom: 16 },
  title:   { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  devBox:  { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, width: '100%', marginBottom: 20 },
  devText: { fontSize: 12, color: '#991B1B', fontFamily: 'monospace' },
  btn:     { backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
