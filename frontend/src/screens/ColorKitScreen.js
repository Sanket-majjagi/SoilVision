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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  heroDark:    '#1B5E20',
  heroMid:     '#2E7D32',
  heroLight:   '#388E3C',
  golden:      '#C8A951',
  bg:          '#F4F6F4',
  card:        '#ffffff',
  primary:     '#2E7D32',
  primaryDark: '#1B5E20',
  accentBg:    '#E8F5E9',
  subHero:     '#A5D6A7',
  inputBg:     '#F9FFF9',
  inputBdr:    '#C8E6C9',
  inputFocus:  '#2E7D32',
  inputText:   '#1B5E20',
  placeholder: '#A5D6A7',
  labelColor:  '#2D2D2D',
  disabled:    '#81c784',
  errorBg:     '#ffffff',
  errorBdr:    '#D32F2F',
  errorText:   '#D32F2F',
};

const LEVELS = ['Low', 'Medium', 'High'];

// Per-level colours — unselected vs selected
const LEVEL_COLORS = {
  Low: {
    unselBg:     '#FFEBEE',
    unselBorder: '#E0E0E0',
    unselText:   '#888888',
    selBg:       '#FFEBEE',
    selBorder:   '#EF5350',
    selText:     '#C62828',
  },
  Medium: {
    unselBg:     '#FFF8E1',
    unselBorder: '#E0E0E0',
    unselText:   '#888888',
    selBg:       '#FFF8E1',
    selBorder:   '#FFB300',
    selText:     '#E65100',
  },
  High: {
    unselBg:     '#E8F5E9',
    unselBorder: '#E0E0E0',
    unselText:   '#888888',
    selBg:       '#E8F5E9',
    selBorder:   '#66BB6A',
    selText:     '#2E7D32',
  },
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
  const [landFocused, setLandFocused] = useState(false);

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
    <KeyboardAwareScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      extraScrollHeight={100}
    >
      {/* ── Hero — matches HomeScreen & ManualEntryScreen exactly ── */}
      <View style={styles.hero}>
        {/* Decorative circles */}
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        <Text style={styles.heroEmoji}>🎨</Text>
        <Text style={styles.heroTitle}>Colour Kit</Text>
        <Text style={styles.heroSub}>रंग किट  ·  ಬಣ್ಣ ಕಿಟ್</Text>

        {/* Premium golden accent line */}
        <View style={styles.goldenLine} />

        {/* Wave divider */}
        <View style={styles.wave} />
      </View>

      <View style={styles.body}>

        {/* ── Land Size Card ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#0277BD' }]} />
            <Text style={styles.sectionTitle}>📐 Land Size</Text>
          </View>
          <TextInput
            style={[styles.textInput, landFocused && styles.textInputFocused]}
            keyboardType="numeric"
            placeholder="Enter your land size in acres  (e.g. 5)"
            placeholderTextColor={C.placeholder}
            value={landSize}
            onChangeText={setLandSize}
            onFocus={() => setLandFocused(true)}
            onBlur={() => setLandFocused(false)}
          />
          <Text style={styles.inputHint}>acres</Text>
        </View>

        {/* ── NPK Readings Card ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: C.primary }]} />
            <Text style={styles.sectionTitle}>🌱 NPK Readings</Text>
          </View>

          {NUTRIENTS.map(({ key, label, emoji }) => (
            <View key={key} style={styles.nutrientBlock}>
              {/* Nutrient label row */}
              <View style={styles.nutrientLabelRow}>
                <Text style={styles.nutrientEmoji}>{emoji}</Text>
                <Text style={styles.nutrientLabel}>{label}</Text>
              </View>

              {/* Low / Medium / High buttons */}
              <View style={styles.buttonGroup}>
                {LEVELS.map((level) => {
                  const selected = selections[key] === level;
                  const lc = LEVEL_COLORS[level];
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.levelBtn,
                        {
                          backgroundColor: selected ? lc.selBg    : '#ffffff',
                          borderColor:     selected ? lc.selBorder : lc.unselBorder,
                        },
                      ]}
                      onPress={() => select(key, level)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.levelBtnText,
                          { color: selected ? lc.selText : lc.unselText,
                            fontWeight: selected ? '700' : '500' },
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* ── Info Banner ── */}
        <View style={styles.noteBox}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <Text style={styles.noteText}>
            Color kits test only NPK. For micronutrients and full 12-parameter analysis, use{' '}
            <Text style={styles.noteLink}>Manual Entry</Text>.
          </Text>
        </View>

        {/* ── Error Box — matches ManualEntryScreen ── */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
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

        <Text style={styles.hint}>
          Select a level for each nutrient before analysing.
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  container: { flexGrow: 1 },

  // ── Hero — exact match to HomeScreen / ManualEntryScreen ──
  hero: {
    backgroundColor: C.heroDark,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 54,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  decCircle1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#2E7D32',
    top: -70,
    right: -70,
    opacity: 0.55,
  },
  decCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#388E3C',
    bottom: 8,
    left: -50,
    opacity: 0.35,
  },
  heroEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  heroSub: {
    fontSize: 13,
    color: C.subHero,
    marginBottom: 14,
  },
  goldenLine: {
    width: 60,
    height: 2,
    backgroundColor: C.golden,
    borderRadius: 2,
    marginBottom: 4,
  },
  wave: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: C.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // ── Body ──
  body: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: C.bg,
  },

  // ── Section card ──
  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4EE',
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.primaryDark,
    flex: 1,
  },

  // ── Land size input ──
  textInput: {
    borderWidth: 1.5,
    borderColor: C.inputBdr,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: C.inputBg,
    color: C.inputText,
    marginBottom: 6,
  },
  textInputFocused: {
    borderColor: C.inputFocus,
    borderWidth: 2,
  },
  inputHint: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    paddingLeft: 2,
  },

  // ── Nutrient block ──
  nutrientBlock: {
    marginBottom: 18,
  },
  nutrientLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  nutrientEmoji: {
    fontSize: 16,
  },
  nutrientLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: C.labelColor,
    letterSpacing: 0.2,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  levelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBtnText: {
    fontSize: 14,
  },

  // ── Info banner ──
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.accentBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: C.primaryDark,
    gap: 8,
  },
  noteIcon: { fontSize: 16 },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: C.primaryDark,
    lineHeight: 20,
  },
  noteLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // ── Error Box — matches ManualEntryScreen ──
  errorBox: {
    backgroundColor: C.errorBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.errorBdr,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    gap: 10,
  },
  errorIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  errorText: {
    flex: 1,
    color: C.errorText,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // ── CTA ──
  cta: {
    backgroundColor: C.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 8,
    elevation: 6,
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    gap: 10,
  },
  ctaDisabled: {
    backgroundColor: C.disabled,
    elevation: 0,
    shadowOpacity: 0,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  ctaArrow: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '300',
  },

  // ── Footer hint ──
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    marginBottom: 20,
  },
});
