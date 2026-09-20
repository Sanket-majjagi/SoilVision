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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// ─── Design tokens ───────────────────────────────────────────────────────────
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
  accentText:  '#2E7D32',
  labelColor:  '#2D2D2D',
  unitColor:   '#888888',
  inputBg:     '#F9FFF9',
  inputBdr:    '#C8E6C9',
  inputFocus:  '#2E7D32',
  inputText:   '#1B5E20',
  placeholder: '#A5D6A7',
  subHero:     '#A5D6A7',
  errorBg:     '#ffffff',
  errorBdr:    '#D32F2F',
  errorText:   '#D32F2F',
  disabled:    '#81c784',
  hint:        '#888888',
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

  // Per-field focus state for styled focus border
  const [focusedField, setFocusedField] = useState(null);

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
    if (parsed.ph < 0 || parsed.ph > 14) {
      setErrorMsg("pH must be between 0 and 14.");
      return;
    }
    if (parsed.ec < 0 || parsed.ec > 16) {
      setErrorMsg("EC must be between 0 and 16 dS/m.");
      return;
    }
    if (parsed.nitrogen < 0 || parsed.nitrogen > 600) {
      setErrorMsg("Nitrogen must be between 0 and 600 kg/ha.");
      return;
    }
    if (parsed.phosphorus < 0 || parsed.phosphorus > 56) {
      setErrorMsg("Phosphorus must be between 0 and 56 kg/ha (ICAR limit)."); return;
    }
    if (parsed.potassium < 0 || parsed.potassium > 1120) {
      setErrorMsg("Potassium must be between 0 and 1120 kg/ha (ICAR limit)."); return;
    }
    if (parsed.organicCarbon < 0 || parsed.organicCarbon > 5) {
      setErrorMsg("Organic Carbon must be between 0 and 5%."); return;
    }
    if (parsed.sulphur < 0 || parsed.sulphur > 80) {
      setErrorMsg("Sulphur must be between 0 and 80 mg/kg."); return;
    }
    if (parsed.zinc < 0 || parsed.zinc > 20) {
      setErrorMsg("Zinc must be between 0 and 20 mg/kg."); return;
    }
    if (parsed.iron < 0 || parsed.iron > 200) {
      setErrorMsg("Iron must be between 0 and 200 mg/kg."); return;
    }
    if (parsed.copper < 0 || parsed.copper > 20) {
      setErrorMsg("Copper must be between 0 and 20 mg/kg."); return;
    }
    if (parsed.manganese < 0 || parsed.manganese > 100) {
      setErrorMsg("Manganese must be between 0 and 100 mg/kg."); return;
    }
    if (parsed.boron < 0 || parsed.boron > 5) {
      setErrorMsg("Boron must be between 0 and 5 mg/kg."); return;
    }
    if (parsed.landSize <= 0 || parsed.landSize > 500) {
      setErrorMsg("Land size must be between 0.1 and 500 acres."); return;
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

  // ─── Shared input style builder (focus-aware) ────────────────────────────
  const inputStyle = (fieldName) => [
    styles.input,
    focusedField === fieldName && styles.inputFocused,
  ];

  // ─── Reusable input row renderer ────────────────────────────────────────
  const renderField = ({ fieldName, label, unit, ref, value, onChange, placeholder, returnKey, onSubmit, isLast }) => (
    <View style={[styles.inputRow, isLast && styles.inputRowLast]} key={fieldName}>
      <View style={styles.labelBlock}>
        <Text style={styles.label}>{label}</Text>
        {unit ? <Text style={styles.unitLabel}>{unit}</Text> : null}
      </View>
      <TextInput
        ref={ref}
        style={inputStyle(fieldName)}
        keyboardType="numeric"
        placeholderTextColor={C.placeholder}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        returnKeyType={returnKey || 'next'}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocusedField(fieldName)}
        onBlur={() => setFocusedField(null)}
      />
    </View>
  );

  return (
    <KeyboardAwareScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      extraScrollHeight={100}
    >
      {/* ── Hero Banner — matches HomeScreen exactly ── */}
      <View style={styles.hero}>
        {/* Decorative circles */}
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        <Text style={styles.heroEmoji}>✏️</Text>
        <Text style={styles.heroTitle}>Manual Entry</Text>
        <Text style={styles.heroSub}>मैन्युअल प्रविष्टि  ·  ಹಸ್ತಚಾಲಿತ ನಮೂದು</Text>

        {/* Premium golden accent line */}
        <View style={styles.goldenLine} />

        {/* Wave divider */}
        <View style={styles.wave} />
      </View>

      <View style={styles.body}>

        {/* ── Land Size ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#0277BD' }]} />
            <Text style={styles.sectionTitle}>📐 Land Size</Text>
          </View>
          {renderField({
            fieldName: 'landSize', label: 'Acres', unit: 'acres',
            ref: refLandSize, value: landSize, onChange: setLandSize,
            placeholder: 'e.g. 5', returnKey: 'next',
            onSubmit: () => refNitrogen.current?.focus(), isLast: true,
          })}
        </View>

        {/* ── Macronutrients ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: C.primary }]} />
            <Text style={styles.sectionTitle}>📊 Macronutrients</Text>
            <View style={styles.unitBadge}><Text style={styles.unitBadgeText}>kg / ha</Text></View>
          </View>

          {renderField({
            fieldName: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha',
            ref: refNitrogen, value: nitrogen, onChange: setNitrogen,
            placeholder: 'e.g. 320', returnKey: 'next',
            onSubmit: () => refPhosphorus.current?.focus(),
          })}
          {renderField({
            fieldName: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha',
            ref: refPhosphorus, value: phosphorus, onChange: setPhosphorus,
            placeholder: 'e.g. 18', returnKey: 'next',
            onSubmit: () => refPotassium.current?.focus(),
          })}
          {renderField({
            fieldName: 'potassium', label: 'Potassium (K)', unit: 'kg/ha',
            ref: refPotassium, value: potassium, onChange: setPotassium,
            placeholder: 'e.g. 200', returnKey: 'next',
            onSubmit: () => refOrganicCarbon.current?.focus(),
          })}
          {renderField({
            fieldName: 'organicCarbon', label: 'Organic Carbon (%)', unit: '≤ 5%',
            ref: refOrganicCarbon, value: organicCarbon, onChange: setOrganicCarbon,
            placeholder: 'e.g. 0.62', returnKey: 'next',
            onSubmit: () => refSulphur.current?.focus(), isLast: true,
          })}
        </View>

        {/* ── Micronutrients ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#E65100' }]} />
            <Text style={styles.sectionTitle}>🔬 Micronutrients</Text>
            <View style={styles.unitBadge}><Text style={styles.unitBadgeText}>mg / kg</Text></View>
          </View>

          {renderField({
            fieldName: 'sulphur', label: 'Sulphur (S)', unit: 'mg/kg',
            ref: refSulphur, value: sulphur, onChange: setSulphur,
            placeholder: 'e.g. 12.5', returnKey: 'next',
            onSubmit: () => refZinc.current?.focus(),
          })}
          {renderField({
            fieldName: 'zinc', label: 'Zinc (Zn)', unit: 'mg/kg',
            ref: refZinc, value: zinc, onChange: setZinc,
            placeholder: 'e.g. 0.8', returnKey: 'next',
            onSubmit: () => refIron.current?.focus(),
          })}
          {renderField({
            fieldName: 'iron', label: 'Iron (Fe)', unit: 'mg/kg',
            ref: refIron, value: iron, onChange: setIron,
            placeholder: 'e.g. 5.2', returnKey: 'next',
            onSubmit: () => refCopper.current?.focus(),
          })}
          {renderField({
            fieldName: 'copper', label: 'Copper (Cu)', unit: 'mg/kg',
            ref: refCopper, value: copper, onChange: setCopper,
            placeholder: 'e.g. 0.3', returnKey: 'next',
            onSubmit: () => refManganese.current?.focus(),
          })}
          {renderField({
            fieldName: 'manganese', label: 'Manganese (Mn)', unit: 'mg/kg',
            ref: refManganese, value: manganese, onChange: setManganese,
            placeholder: 'e.g. 3.1', returnKey: 'next',
            onSubmit: () => refBoron.current?.focus(),
          })}
          {renderField({
            fieldName: 'boron', label: 'Boron (B)', unit: 'mg/kg',
            ref: refBoron, value: boron, onChange: setBoron,
            placeholder: 'e.g. 0.6', returnKey: 'next',
            onSubmit: () => refPh.current?.focus(), isLast: true,
          })}
        </View>

        {/* ── Soil Properties ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#558B2F' }]} />
            <Text style={styles.sectionTitle}>🌡️ Soil Properties</Text>
          </View>

          {renderField({
            fieldName: 'ph', label: 'pH', unit: '0 – 14',
            ref: refPh, value: ph, onChange: setPh,
            placeholder: 'e.g. 6.8', returnKey: 'next',
            onSubmit: () => refEc.current?.focus(),
          })}
          {renderField({
            fieldName: 'ec', label: 'EC', unit: 'dS/m',
            ref: refEc, value: ec, onChange: setEc,
            placeholder: 'e.g. 0.45', returnKey: 'done',
            isLast: true,
          })}
        </View>

        {/* ── Error Box ── */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
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
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  container: { flexGrow: 1 },

  // ── Hero — exact match to HomeScreen ──
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
    paddingBottom: 8,
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
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: C.primaryDark,
  },
  unitBadge: {
    backgroundColor: C.accentBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  unitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.accentText,
  },

  // ── Input row ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  inputRowLast: {
    marginBottom: 8,
  },
  labelBlock: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: C.labelColor,
    marginBottom: 2,
  },
  unitLabel: {
    fontSize: 11,
    color: C.unitColor,
    fontWeight: '500',
  },
  input: {
    width: '55%',
    borderWidth: 1.5,
    borderColor: C.inputBdr,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: C.inputBg,
    color: C.inputText,
  },
  inputFocused: {
    borderColor: C.inputFocus,
    borderWidth: 2,
  },

  // ── Error Box ──
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
    color: C.hint,
    marginTop: 8,
    marginBottom: 20,
  },
});
