import React, { useState, useRef } from 'react';
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
import { analyzeSoil } from '../services/api';

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  hero:       '#1a5c2e',
  primary:    '#2e7d32',
  accent:     '#4caf50',
  accentLt:   '#e8f5e9',
  bg:         '#f0f4f0',
  card:       '#ffffff',
  label:      '#1a3a22',
  sublabel:   '#6b8f6b',
  inputBg:    '#f7faf7',
  inputBdr:   '#d0e4d0',
  placeholder:'#a8c4a8',
  disabled:   '#81c784',
};

export default function ManualEntryScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Individual state for every field — prevents sub-component re-render focus loss
  const [landSize,       setLandSize]       = useState('');
  const [nitrogen,       setNitrogen]       = useState('');
  const [phosphorus,     setPhosphorus]     = useState('');
  const [potassium,      setPotassium]      = useState('');
  const [organicCarbon,  setOrganicCarbon]  = useState('');
  const [sulphur,        setSulphur]        = useState('');
  const [zinc,           setZinc]           = useState('');
  const [iron,           setIron]           = useState('');
  const [copper,         setCopper]         = useState('');
  const [manganese,      setManganese]      = useState('');
  const [boron,          setBoron]          = useState('');
  const [ph,             setPh]             = useState('');
  const [ec,             setEc]             = useState('');

  // Refs for focus chain (returnKeyType="next")
  const refLandSize      = useRef(null);
  const refNitrogen      = useRef(null);
  const refPhosphorus    = useRef(null);
  const refPotassium     = useRef(null);
  const refOrganicCarbon = useRef(null);
  const refSulphur       = useRef(null);
  const refZinc          = useRef(null);
  const refIron          = useRef(null);
  const refCopper        = useRef(null);
  const refManganese     = useRef(null);
  const refBoron         = useRef(null);
  const refPh            = useRef(null);
  const refEc            = useRef(null);

  // Field label lookup for readable error messages
  const FIELD_LABELS = {
    landSize: 'Land Size', nitrogen: 'Nitrogen', phosphorus: 'Phosphorus',
    potassium: 'Potassium', organicCarbon: 'Organic Carbon', sulphur: 'Sulphur',
    zinc: 'Zinc', iron: 'Iron', copper: 'Copper', manganese: 'Manganese',
    boron: 'Boron', ph: 'pH', ec: 'EC',
  };

  const handleAnalyze = async () => {
    setErrorMsg(''); // Clear previous error

    const parsed = {
      landSize: parseFloat(landSize), nitrogen: parseFloat(nitrogen),
      phosphorus: parseFloat(phosphorus), potassium: parseFloat(potassium),
      organicCarbon: parseFloat(organicCarbon), sulphur: parseFloat(sulphur),
      zinc: parseFloat(zinc), iron: parseFloat(iron), copper: parseFloat(copper),
      manganese: parseFloat(manganese), boron: parseFloat(boron),
      ph: parseFloat(ph), ec: parseFloat(ec),
    };
    const invalidFields = Object.entries(parsed).filter(([, v]) => isNaN(v)).map(([k]) => FIELD_LABELS[k]);
    if (invalidFields.length > 0) {
      setErrorMsg(`Please fill all fields with valid numbers: ${invalidFields.join(', ')}`);
      return;
    }
    const soilData = {
      nitrogen: parsed.nitrogen, phosphorus: parsed.phosphorus, potassium: parsed.potassium,
      ph: parsed.ph, ec: parsed.ec, organic_carbon: parsed.organicCarbon,
      sulphur: parsed.sulphur, zinc: parsed.zinc, iron: parsed.iron,
      copper: parsed.copper, manganese: parsed.manganese, boron: parsed.boron,
    };
    try {
      setLoading(true);
      const result = await analyzeSoil(soilData, parsed.landSize);
      setLoading(false);
      navigation.navigate('Results', { resultData: result });
    } catch (error) {
      setLoading(false);
      setErrorMsg(error.message || 'Analysis Failed. Check your network and try again.');
    }
  };

  // ─── Shared input style ───────────────────────────────────────────────────
  const inputProps = {
    style: styles.input,
    keyboardType: 'numeric',
    placeholderTextColor: C.placeholder,
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Banner ── */}
      <View style={styles.hero}>
        <View style={styles.decCircle} />
        <Text style={styles.heroEmoji}>✏️</Text>
        <Text style={styles.heroTitle}>Manual Entry</Text>
        <Text style={styles.heroSub}>मैन्युअल प्रविष्टि  ·  ಹಸ್ತಚಾಲಿತ ನಮೂದು</Text>
      </View>

      <View style={styles.body}>

        {/* ── Land Size ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#0277bd' }]} />
            <Text style={styles.sectionTitle}>📐 Land Size</Text>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Acres  </Text>
            <TextInput
              ref={refLandSize}
              {...inputProps}
              placeholder="e.g. 5"
              value={landSize}
              onChangeText={setLandSize}
              returnKeyType="next"
              onSubmitEditing={() => refNitrogen.current?.focus()}
            />
          </View>
        </View>

        {/* ── Macronutrients ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: C.primary }]} />
            <Text style={styles.sectionTitle}>📊 Macronutrients</Text>
            <Text style={styles.sectionUnit}>kg / ha</Text>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Nitrogen (N)</Text>
            <TextInput
              ref={refNitrogen}
              {...inputProps}
              placeholder="e.g. 320"
              value={nitrogen}
              onChangeText={setNitrogen}
              returnKeyType="next"
              onSubmitEditing={() => refPhosphorus.current?.focus()}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Phosphorus (P)</Text>
            <TextInput
              ref={refPhosphorus}
              {...inputProps}
              placeholder="e.g. 18"
              value={phosphorus}
              onChangeText={setPhosphorus}
              returnKeyType="next"
              onSubmitEditing={() => refPotassium.current?.focus()}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Potassium (K)</Text>
            <TextInput
              ref={refPotassium}
              {...inputProps}
              placeholder="e.g. 200"
              value={potassium}
              onChangeText={setPotassium}
              returnKeyType="next"
              onSubmitEditing={() => refOrganicCarbon.current?.focus()}
            />
          </View>

          <View style={[styles.inputRow, styles.inputRowLast]}>
            <Text style={styles.label}>Organic Carbon (%)</Text>
            <TextInput
              ref={refOrganicCarbon}
              {...inputProps}
              placeholder="e.g. 0.62"
              value={organicCarbon}
              onChangeText={setOrganicCarbon}
              returnKeyType="next"
              onSubmitEditing={() => refSulphur.current?.focus()}
            />
          </View>
        </View>

        {/* ── Micronutrients ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#e65100' }]} />
            <Text style={styles.sectionTitle}>🔬 Micronutrients</Text>
            <Text style={styles.sectionUnit}>mg / kg</Text>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Sulphur (S)</Text>
            <TextInput
              ref={refSulphur}
              {...inputProps}
              placeholder="e.g. 12.5"
              value={sulphur}
              onChangeText={setSulphur}
              returnKeyType="next"
              onSubmitEditing={() => refZinc.current?.focus()}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Zinc (Zn)</Text>
            <TextInput
              ref={refZinc}
              {...inputProps}
              placeholder="e.g. 0.8"
              value={zinc}
              onChangeText={setZinc}
              returnKeyType="next"
              onSubmitEditing={() => refIron.current?.focus()}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Iron (Fe)</Text>
            <TextInput
              ref={refIron}
              {...inputProps}
              placeholder="e.g. 5.2"
              value={iron}
              onChangeText={setIron}
              returnKeyType="next"
              onSubmitEditing={() => refCopper.current?.focus()}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Copper (Cu)</Text>
            <TextInput
              ref={refCopper}
              {...inputProps}
              placeholder="e.g. 0.3"
              value={copper}
              onChangeText={setCopper}
              returnKeyType="next"
              onSubmitEditing={() => refManganese.current?.focus()}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Manganese (Mn)</Text>
            <TextInput
              ref={refManganese}
              {...inputProps}
              placeholder="e.g. 3.1"
              value={manganese}
              onChangeText={setManganese}
              returnKeyType="next"
              onSubmitEditing={() => refBoron.current?.focus()}
            />
          </View>

          <View style={[styles.inputRow, styles.inputRowLast]}>
            <Text style={styles.label}>Boron (B)</Text>
            <TextInput
              ref={refBoron}
              {...inputProps}
              placeholder="e.g. 0.6"
              value={boron}
              onChangeText={setBoron}
              returnKeyType="next"
              onSubmitEditing={() => refPh.current?.focus()}
            />
          </View>
        </View>

        {/* ── Soil Properties ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#558b2f' }]} />
            <Text style={styles.sectionTitle}>🌡️ Soil Properties</Text>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>pH  (0 – 14)</Text>
            <TextInput
              ref={refPh}
              {...inputProps}
              placeholder="e.g. 6.8"
              value={ph}
              onChangeText={setPh}
              returnKeyType="next"
              onSubmitEditing={() => refEc.current?.focus()}
            />
          </View>

          <View style={[styles.inputRow, styles.inputRowLast]}>
            <Text style={styles.label}>EC  (dS/m)</Text>
            <TextInput
              ref={refEc}
              {...inputProps}
              placeholder="e.g. 0.45"
              value={ec}
              onChangeText={setEc}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* ── Error Box ── */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* ── CTA Button ── */}
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
          All 13 fields are required for a complete analysis.
        </Text>
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
    paddingBottom: 44,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'flex-start',
  },
  decCircle: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -40, right: -40,
  },
  heroEmoji:  { fontSize: 32, marginBottom: 8 },
  heroTitle:  { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub:    { fontSize: 13, color: 'rgba(255,255,255,0.70)' },

  // Body
  body: {
    padding: 16,
    paddingBottom: 40,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: C.bg,
  },

  // Section card
  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#1a5c2e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef4ee',
  },
  sectionDot: {
    width: 10, height: 10, borderRadius: 5, marginRight: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16, fontWeight: '700', color: C.label,
  },
  sectionUnit: {
    fontSize: 12, color: C.sublabel, fontWeight: '600',
    backgroundColor: C.accentLt, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10,
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  inputRowLast: { marginBottom: 12 },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.label,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.inputBdr,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: C.inputBg,
    color: '#1a3a22',
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
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 12,
    elevation: 5,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    gap: 10,
  },
  ctaDisabled: { backgroundColor: C.disabled, elevation: 0, shadowOpacity: 0 },
  ctaText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  ctaArrow: { fontSize: 22, color: '#fff', fontWeight: '300' },
  hint: { textAlign: 'center', fontSize: 12, color: C.sublabel, marginBottom: 20 },
});
