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
import { checkCrop } from '../services/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  hero: '#1a5c2e', primary: '#2e7d32', accent: '#4caf50', accentLt: '#e8f5e9',
  bg: '#f0f4f0', card: '#ffffff', label: '#1a3a22', sublabel: '#6b8f6b',
  inputBg: '#f7faf7', inputBdr: '#d0e4d0', placeholder: '#a8c4a8', disabled: '#81c784',
};

// ─── Field definitions ─────────────────────────────────────────────────────────
const FIELDS = [
  { key: 'nitrogen',       label: 'Nitrogen',       unit: 'kg/ha', placeholder: 'e.g. 320'  },
  { key: 'phosphorus',     label: 'Phosphorus',     unit: 'kg/ha', placeholder: 'e.g. 18'   },
  { key: 'potassium',      label: 'Potassium',      unit: 'kg/ha', placeholder: 'e.g. 200'  },
  { key: 'ph',             label: 'pH',             unit: '0-14',  placeholder: 'e.g. 6.8'  },
  { key: 'ec',             label: 'EC',             unit: 'dS/m',  placeholder: 'e.g. 0.45' },
  { key: 'organic_carbon', label: 'Organic Carbon', unit: '%',     placeholder: 'e.g. 0.62' },
  { key: 'sulphur',        label: 'Sulphur',        unit: 'mg/kg', placeholder: 'e.g. 12.5' },
  { key: 'zinc',           label: 'Zinc',           unit: 'mg/kg', placeholder: 'e.g. 0.8'  },
  { key: 'boron',          label: 'Boron',          unit: 'mg/kg', placeholder: 'e.g. 0.6'  },
  { key: 'iron',           label: 'Iron',           unit: 'mg/kg', placeholder: 'e.g. 5.2'  },
  { key: 'manganese',      label: 'Manganese',      unit: 'mg/kg', placeholder: 'e.g. 3.1'  },
  { key: 'copper',         label: 'Copper',         unit: 'mg/kg', placeholder: 'e.g. 0.3'  },
];

const EMPTY_FORM = Object.fromEntries(FIELDS.map((f) => [f.key, '']));

// ─── Score bar ─────────────────────────────────────────────────────────────────
function SuitabilityBar({ score }) {
  const pct   = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? '#2e7d32' : pct >= 60 ? '#66bb6a' : pct >= 40 ? '#ff9800' : '#f44336';
  return (
    <View style={bar.wrapper}>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[bar.label, { color }]}>{pct}/100</Text>
    </View>
  );
}
const bar = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 },
  track:   { flex: 1, height: 14, backgroundColor: '#e0e0e0', borderRadius: 7, overflow: 'hidden' },
  fill:    { height: '100%', borderRadius: 7 },
  label:   { fontSize: 15, fontWeight: '800', width: 56, textAlign: 'right' },
});

// ─── Result card ───────────────────────────────────────────────────────────────
function ResultCard({ result }) {
  if (!result) return null;
  const { suitable, suitability_score, crop, season, deficiency_fixes = [] } = result;
  return (
    <View style={rc.card}>
      <View style={[rc.banner, suitable ? rc.bannerGreen : rc.bannerRed]}>
        <Text style={rc.bannerText}>
          {suitable ? '✅  Suitable for your soil' : '❌  Not recommended for your soil'}
        </Text>
      </View>
      <Text style={rc.cropName}>{crop}</Text>
      {season ? <Text style={rc.season}>📅 Season: {season}</Text> : null}
      <Text style={rc.scoreLabel}>Suitability Score</Text>
      <SuitabilityBar score={suitability_score} />
      {deficiency_fixes.length > 0 && (
        <>
          <Text style={rc.fixTitle}>Recommendations</Text>
          {deficiency_fixes.map((fix, i) => (
            <View key={i} style={rc.fixRow}>
              <Text style={rc.fixBullet}>•</Text>
              <Text style={rc.fixText}>{fix}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}
const rc = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginTop: 16,
    elevation: 3, shadowColor: '#1a5c2e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  banner: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 14 },
  bannerGreen: { backgroundColor: '#e8f5e9', borderWidth: 1.5, borderColor: '#4caf50' },
  bannerRed:   { backgroundColor: '#ffebee', borderWidth: 1.5, borderColor: '#f44336' },
  bannerText:  { fontSize: 16, fontWeight: '700', color: '#333' },
  cropName: { fontSize: 22, fontWeight: '800', color: '#2e7d32', textTransform: 'capitalize', marginBottom: 4 },
  season:   { fontSize: 14, color: '#666', marginBottom: 14 },
  scoreLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  fixTitle: { fontSize: 15, fontWeight: '700', color: '#444', marginBottom: 10 },
  fixRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  fixBullet: { fontSize: 18, color: '#4caf50', marginRight: 8, lineHeight: 22 },
  fixText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 22 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function CropCheckScreen() {
  const [cropName, setCropName] = useState('');
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCheck = async () => {
    setErrorMsg('');
    if (!cropName.trim()) {
      setErrorMsg('Please enter a crop name.');
      return;
    }
    const emptyFields = FIELDS.filter(
      (f) => !form[f.key].trim() || isNaN(parseFloat(form[f.key]))
    );
    if (emptyFields.length > 0) {
      setErrorMsg(`Please fill in valid numbers for: ${emptyFields.map((f) => f.label).join(', ')}`);
      return;
    }
    const soilData = Object.fromEntries(FIELDS.map((f) => [f.key, parseFloat(form[f.key])]));
    try {
      setLoading(true);
      setResult(null);
      const data = await checkCrop(cropName.toLowerCase().trim(), soilData);
      setResult(data);
    } catch (error) {
      setErrorMsg(error.message || 'Check Failed. Check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.decCircle} />
        <Text style={styles.heroEmoji}>🌾</Text>
        <Text style={styles.heroTitle}>Crop Check</Text>
        <Text style={styles.heroSub}>फसल जाँचें  ·  ಬೆಳೆ ಪರಿಶೀಲಿಸಿ</Text>
        <Text style={styles.heroDesc}>
          Find out if your soil conditions are suitable for a specific crop.
        </Text>
      </View>

      <View style={styles.body}>

        {/* ── Crop Name ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#558b2f' }]} />
            <Text style={styles.sectionTitle}>🌾 Crop Name</Text>
          </View>
          <TextInput
            style={styles.cropInput}
            placeholder="Enter crop name  (e.g. rice, wheat, maize)"
            placeholderTextColor={C.placeholder}
            value={cropName}
            onChangeText={setCropName}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* ── Soil Values ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: C.primary }]} />
            <Text style={styles.sectionTitle}>📊 Soil Values</Text>
          </View>

          {FIELDS.map(({ key, label, unit, placeholder }) => (
            <View key={key} style={styles.inputRow}>
              <View style={styles.labelBlock}>
                <Text style={styles.inputLabel}>{label}</Text>
                <Text style={styles.inputUnit}>{unit}</Text>
              </View>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder={placeholder}
                placeholderTextColor={C.placeholder}
                value={form[key]}
                onChangeText={(v) => handleChange(key, v)}
              />
            </View>
          ))}
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
          onPress={handleCheck}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.ctaText}>Check Crop</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Inline Result ── */}
        <ResultCard result={result} />
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  container: {},

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
    padding: 16, paddingBottom: 50, marginTop: -20,
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
  sectionDot:  { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', color: C.label },

  // Crop name
  cropInput: {
    borderWidth: 1.5, borderColor: C.inputBdr, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: '600',
    backgroundColor: C.inputBg, color: C.label,
    marginBottom: 8,
  },

  // Soil inputs
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, gap: 10,
  },
  labelBlock: { flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: C.label },
  inputUnit:  { fontSize: 11, color: C.sublabel, fontWeight: '600', marginTop: 1 },
  input: {
    flex: 1,
    borderWidth: 1.5, borderColor: C.inputBdr, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, fontWeight: '600',
    backgroundColor: C.inputBg, color: C.label,
  },

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
});
