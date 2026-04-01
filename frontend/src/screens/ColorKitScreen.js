import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { analyzeColorKit } from '../services/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  hero: '#1a5c2e', primary: '#2e7d32', accent: '#4caf50', accentLt: '#e8f5e9',
  bg: '#f0f4f0', card: '#ffffff', label: '#1a3a22', sublabel: '#6b8f6b',
  inputBg: '#f7faf7', inputBdr: '#d0e4d0', placeholder: '#a8c4a8', disabled: '#81c784',
};

const LEVELS = ['Low', 'Medium', 'High'];

// Color per level for visual richness
const LEVEL_COLORS = {
  Low:    { bg: '#ffebee', border: '#ef9a9a', text: '#c62828', selBg: '#f44336', selText: '#fff' },
  Medium: { bg: '#fff8e1', border: '#ffcc80', text: '#e65100', selBg: '#ff9800', selText: '#fff' },
  High:   { bg: '#e8f5e9', border: '#a5d6a7', text: '#1b5e20', selBg: '#4caf50', selText: '#fff' },
};

const NUTRIENTS = [
  { key: 'nitrogen',   label: 'Nitrogen (N)',   emoji: '🌿' },
  { key: 'phosphorus', label: 'Phosphorus (P)', emoji: '🔥' },
  { key: 'potassium',  label: 'Potassium (K)',  emoji: '⚡' },
];

export default function ColorKitScreen({ navigation }) {
  const [selections, setSelections] = useState({ nitrogen: null, phosphorus: null, potassium: null });
  const [landSize, setLandSize] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const select = (nutrient, level) =>
    setSelections((prev) => ({ ...prev, [nutrient]: level }));

  const handleAnalyze = async () => {
    setErrorMsg('');
    const missing = NUTRIENTS.filter((n) => !selections[n.key]).map((n) => n.label);
    const acres = parseFloat(landSize);
    
    if (missing.length > 0 || !landSize || isNaN(acres) || acres <= 0) {
      setErrorMsg('Please select Low/Medium/High for all nutrients and enter a valid land size.');
      return;
    }
    try {
      setLoading(true);
      const result = await analyzeColorKit(selections, acres);
      setLoading(false);
      navigation.navigate('Results', { resultData: result });
    } catch (error) {
      setLoading(false);
      setErrorMsg(error.message || 'Analysis Failed. Check your network and try again.');
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.decCircle} />
        <Text style={styles.heroEmoji}>🎨</Text>
        <Text style={styles.heroTitle}>Colour Kit</Text>
        <Text style={styles.heroSub}>रंग किट  ·  ಬಣ್ಣ ಕಿಟ್</Text>
        <Text style={styles.heroDesc}>
          Select Low / Medium / High based on your IFFCO or Kisan color kit result.
        </Text>
      </View>

      <View style={styles.body}>

        {/* ── Land Size ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#0277bd' }]} />
            <Text style={styles.sectionTitle}>📐 Land Size</Text>
          </View>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            placeholder="Enter your land size in acres  (e.g. 5)"
            placeholderTextColor={C.placeholder}
            value={landSize}
            onChangeText={setLandSize}
          />
        </View>

        {/* ── NPK Selector ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: C.primary }]} />
            <Text style={styles.sectionTitle}>🌱 NPK Readings</Text>
          </View>

          {NUTRIENTS.map(({ key, label, emoji }) => (
            <View key={key} style={styles.nutrientBlock}>
              <Text style={styles.nutrientLabel}>{emoji}  {label}</Text>
              <View style={styles.buttonGroup}>
                {LEVELS.map((level) => {
                  const selected = selections[key] === level;
                  const lc = LEVEL_COLORS[level];
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.levelBtn,
                        { borderColor: lc.border, backgroundColor: selected ? lc.selBg : lc.bg },
                      ]}
                      onPress={() => select(key, level)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.levelBtnText, { color: selected ? lc.selText : lc.text }]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* ── Info note ── */}
        <View style={styles.noteBox}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <Text style={styles.noteText}>
            Color kits test only NPK. For micronutrients and full 12-parameter analysis, use{' '}
            <Text style={styles.noteLink}>Manual Entry</Text>.
          </Text>
        </View>

        {/* ── Error Box ── */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* ── CTA ── */}
        <TouchableOpacity
          style={[styles.cta, loading && styles.ctaDisabled]}
          onPress={handleAnalyze}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.ctaText}>Analyse Soil</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Hero
  hero: {
    backgroundColor: C.hero,
    paddingTop: Platform.OS === 'android' ? 50 : 58,
    paddingBottom: 52,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  decCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -50,
  },
  heroEmoji: { fontSize: 36, marginBottom: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.70)', marginBottom: 8 },
  heroDesc:  { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },

  // Body
  body: {
    padding: 16, paddingBottom: 40, marginTop: -20,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: C.bg,
  },

  // Section card
  sectionCard: {
    backgroundColor: C.card, borderRadius: 16,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    marginBottom: 14, elevation: 3,
    shadowColor: '#1a5c2e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#eef4ee',
  },
  sectionDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.label },

  // Land size input
  textInput: {
    borderWidth: 1.5, borderColor: C.inputBdr, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: '600',
    backgroundColor: C.inputBg, color: C.label,
    marginBottom: 8,
  },

  // Nutrient block
  nutrientBlock: { marginBottom: 18 },
  nutrientLabel: {
    fontSize: 15, fontWeight: '700', color: C.label,
    marginBottom: 10, letterSpacing: 0.2,
  },
  buttonGroup: { flexDirection: 'row', gap: 10 },
  levelBtn: {
    flex: 1, paddingVertical: 13,
    borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  levelBtnText: { fontSize: 14, fontWeight: '700' },

  // Note
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.accentLt, borderRadius: 12,
    padding: 14, marginBottom: 20,
    borderLeftWidth: 4, borderLeftColor: C.accent,
    gap: 8,
  },
  noteIcon: { fontSize: 16 },
  noteText: { flex: 1, fontSize: 13, color: C.primary, lineHeight: 20 },
  noteLink: { fontWeight: '700', textDecorationLine: 'underline' },

  // Error Box
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // CTA
  cta: {
    backgroundColor: C.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, borderRadius: 14,
    elevation: 5, shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, gap: 10,
  },
  ctaDisabled: { backgroundColor: C.disabled, elevation: 0, shadowOpacity: 0 },
  ctaText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  ctaArrow: { fontSize: 22, color: '#fff', fontWeight: '300' },

  container: {},
});
