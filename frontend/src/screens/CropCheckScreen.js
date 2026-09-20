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
import { getMandiPrices, checkCrop, analyzeSoil } from '../services/api';
import { getWeatherData } from '../services/weather';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import harvestData from '../data/harvest_msp.json';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

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
  unitColor:   '#888888',
  disabled:    '#81c784',
  errorBg:     '#ffffff',
  errorBdr:    '#D32F2F',
  errorText:   '#D32F2F',
};

// ─── Field definitions ────────────────────────────────────────────────────────
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

// ─── Score bar ────────────────────────────────────────────────────────────────
function SuitabilityBar({ score }) {
  const pct   = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? '#2E7D32' : pct >= 60 ? '#66BB6A' : pct >= 40 ? '#FF9800' : '#F44336';
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
  track:   { flex: 1, height: 14, backgroundColor: '#E0E0E0', borderRadius: 7, overflow: 'hidden' },
  fill:    { height: '100%', borderRadius: 7 },
  label:   { fontSize: 15, fontWeight: '800', width: 56, textAlign: 'right' },
});

// ─── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ result, mandiData }) {
  if (!result) return null;
  const { suitable, suitability_score, crop, season, deficiency_fixes = [] } = result;

  const cropKey = crop.toLowerCase();
  const mspInfo = harvestData[cropKey];

  return (
    <View style={rc.card}>
      <View style={[rc.banner, suitable ? rc.bannerGreen : rc.bannerRed]}>
        <Text style={rc.bannerText}>
          {suitable ? '✅  Suitable for your soil' : '❌  Not recommended for your soil'}
        </Text>
      </View>
      <Text style={rc.cropName}>{crop}</Text>
      {season ? <Text style={rc.season}>📅 Season: {season}</Text> : null}

      {/* Harvest MSP & Mandi Info */}
      {(mspInfo || mandiData) && (
        <View style={rc.mspContainer}>
          <Text style={rc.mspTitle}>📊 Market & Harvest Forecast</Text>
          <View style={rc.mspDivider} />
          {mspInfo && (
            <>
              <Text style={rc.mspDuration}>⏳ {mspInfo.duration === 'Perennial' ? 'Perennial crop' : `Ready in ${mspInfo.duration} months`}</Text>
              <Text style={rc.mspPrice}>💰 {mspInfo.type}: ₹{mspInfo.price.toLocaleString('en-IN')} per quintal</Text>
            </>
          )}

          {/* Live Mandi Price UI */}
          {mandiData && (
            <Text style={rc.mandiPrice}>
              📈 Live Mandi:{' '}
              {mandiData.loading ? (
                <Text style={{fontWeight: '400', color: '#555'}}>🔄 Fetching...</Text>
              ) : mandiData.error || !mandiData.priceData ? (
                <Text style={{fontWeight: '400', color: '#888'}}>⚠️ Unavailable today</Text>
              ) : (
                <Text style={{color: C.primaryDark}}>
                  {mandiData.priceData.min_price === mandiData.priceData.max_price
                    ? `₹${mandiData.priceData.min_price}`
                    : `₹${mandiData.priceData.min_price} - ₹${mandiData.priceData.max_price}`
                  } ({mandiData.priceData.matched_state_name})
                </Text>
              )}
            </Text>
          )}
        </View>
      )}

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

      {result.fertilizer_plan && (
        <View style={{ marginTop: 16 }}>
          <Text style={rc.fertHeader}>💊 Fertilizer Plan</Text>
          <View style={rc.mspDivider} />
          <Text style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
            🌍  Land Size: <Text style={{fontWeight: '700'}}>{result.land_size_acres} acres</Text>
          </Text>
          {(!result.fertilizer_plan.recommendations || result.fertilizer_plan.recommendations.length === 0) ? (
             <View style={{ backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#2E7D32' }}>
               <Text style={{ color: '#2E7D32', fontWeight: '700' }}>✅ Your soil is excellent! No fertilizer needed.</Text>
             </View>
          ) : (
            <>
              {result.fertilizer_plan.recommendations.map((r, i) => <FertilizerRow key={i} rec={r} />)}
              <View style={rc.totalRow}>
                <Text style={rc.totalLabel}>Total Estimated Cost</Text>
                <Text style={rc.totalCost}>{result.fertilizer_plan.total_estimated_cost}</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function FertilizerRow({ rec }) {
  if (!rec.fertilizer || rec.fertilizer === 'Advisory') {
    return (
      <View style={rc.advisoryRow}>
        <Text style={rc.advisoryIcon}>⚠️</Text>
        <Text style={rc.advisoryText}>{rec.purpose}</Text>
      </View>
    );
  }
  return (
    <View style={rc.fertRow}>
      <View style={rc.fertLeft}>
        <Text style={rc.fertName}>{rec.fertilizer}</Text>
        <Text style={rc.fertPurpose}>{rec.purpose}</Text>
        {rec.qty_per_acre_kg != null && (
          <Text style={rc.fertQty}>
            {rec.qty_per_acre_kg} kg/acre  ·  Total {rec.total_qty_kg} kg
          </Text>
        )}
      </View>
      <View style={rc.fertCostBox}>
        <Text style={rc.fertCost}>{rec.estimated_cost}</Text>
      </View>
    </View>
  );
}

const generateCropPdf = async (result, mandiData) => {
  const date = new Date().toLocaleDateString('en-IN');
  const cropStr = result.crop.charAt(0).toUpperCase() + result.crop.slice(1);
  const mspInfo = harvestData[result.crop.toLowerCase()];
  
  let fertRows = '';
  let advisories = '';
  let totalCost = '—';

  if (result.fertilizer_plan && result.fertilizer_plan.recommendations) {
    totalCost = result.fertilizer_plan.total_estimated_cost || '—';
    result.fertilizer_plan.recommendations.forEach(r => {
      if (!r.fertilizer || r.fertilizer === 'Advisory') {
        advisories += `<li>${r.purpose}</li>`;
      } else {
        fertRows += `<tr>
          <td><strong>${r.fertilizer}</strong><br><small style="color:#666">${r.purpose}</small></td>
          <td>${r.qty_per_acre_kg || '-'} kg</td>
          <td>${r.total_qty_kg || '-'} kg</td>
          <td>${r.estimated_cost}</td>
        </tr>`;
      }
    });
  }

  let mandiStr = 'Unavailable';
  if (mandiData && mandiData.priceData) {
     mandiStr = mandiData.priceData.min_price === mandiData.priceData.max_price
       ? `₹${mandiData.priceData.min_price}`
       : `₹${mandiData.priceData.min_price} - ₹${mandiData.priceData.max_price}`;
  }

  const html = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #2e7d32; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { color: #1b5e20; margin: 0 0 8px 0; font-size: 24px; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 16px; font-weight: bold; color: #1b5e20; border-bottom: 1px solid #c8e6c9; padding-bottom: 6px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
          th { background: #f1f8e9; color: #2e7d32; font-size: 13px; text-transform: uppercase; }
          td { font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌾 Kisan Mitra Crop Suitability</h1>
          <p>Generated on: ${date}</p>
        </div>
        <div class="section">
          <div class="section-title">Crop Analysis: ${cropStr}</div>
          <p><strong>Suitability Score:</strong> ${result.suitability_score}/100</p>
          <p><strong>Verdict:</strong> ${result.suitable ? '✅ Suitable for your soil' : '❌ Not recommended for your soil'}</p>
          ${result.season ? `<p><strong>Season:</strong> ${result.season}</p>` : ''}
        </div>
        <div class="section">
          <div class="section-title">Market Data</div>
          <table><tr><th>Harvest Duration</th><th>Govt Price</th><th>Live Mandi Price</th></tr>
          <tr>
            <td>${mspInfo ? (mspInfo.duration === 'Perennial' ? 'Perennial' : `${mspInfo.duration} months`) : '-'}</td>
            <td>${mspInfo ? `₹${mspInfo.price}` : '-'}</td>
            <td>${mandiStr}</td>
          </tr></table>
        </div>
        <div class="section">
          <div class="section-title">Fertilizer Plan (${result.land_size_acres} acres)</div>
          ${fertRows ? `<table><tr><th>Fertilizer</th><th>Qty/Acre</th><th>Total Qty</th><th>Cost</th></tr>${fertRows}</table>` : '<p style="color:#2e7d32;font-weight:bold;">✅ Your soil is excellent! No fertilizer needed.</p>'}
          ${advisories ? `<div style="background:#FFF8E1; padding:10px; border-left:3px solid #E65100; margin-bottom: 12px;"><strong>Advisories:</strong><ul style="margin:5px 0;">${advisories}</ul></div>` : ''}
          <div style="text-align:right; font-weight:bold; margin-top:10px;">Total Estimated Cost: ${totalCost}</div>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    return uri;
  } catch (err) {
    Alert.alert('Error', 'Could not generate PDF: ' + err.message);
    return null;
  }
};
const rc = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  banner:      { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 14 },
  bannerGreen: { backgroundColor: '#E8F5E9', borderWidth: 1.5, borderColor: '#66BB6A' },
  bannerRed:   { backgroundColor: '#FFEBEE', borderWidth: 1.5, borderColor: '#EF5350' },
  bannerText:  { fontSize: 16, fontWeight: '700', color: '#333' },
  cropName:    { fontSize: 22, fontWeight: '800', color: '#1B5E20', textTransform: 'capitalize', marginBottom: 4 },
  season:      { fontSize: 14, color: '#666', marginBottom: 14 },
  scoreLabel:  { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  fixTitle:    { fontSize: 15, fontWeight: '700', color: '#444', marginBottom: 10 },
  fixRow:      { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  fixBullet:   { fontSize: 18, color: '#2E7D32', marginRight: 8, lineHeight: 22 },
  fixText:     { flex: 1, fontSize: 14, color: '#444', lineHeight: 22 },
  
  // Harvest MSP
  mspContainer: {
    backgroundColor: '#F9FBF9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  mspTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 6,
  },
  mspDivider: {
    height: 1,
    backgroundColor: '#C8E6C9',
    marginBottom: 8,
  },
  mspDuration: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  mspPrice: {
    fontSize: 12,
    color: '#1B5E20',
    fontWeight: '700',
  },
  mandiPrice: {
    fontSize: 12,
    color: '#1B5E20',
    fontWeight: '700',
    marginTop: 2,
  },
  fertHeader: { fontSize: 16, fontWeight: '700', color: C.primaryDark, marginBottom: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderColor: '#eee' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#444' },
  totalCost: { fontSize: 16, fontWeight: '800', color: C.primaryDark },
  advisoryRow: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF8E1',
    borderRadius: 8, padding: 10, marginVertical: 6, borderLeftWidth: 3, borderLeftColor: '#E65100', gap: 6,
  },
  advisoryText: { flex: 1, fontSize: 13, color: '#E65100' },
  advisoryIcon: { fontSize: 16 },
  fertRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12,
    marginBottom: 8, elevation: 1, borderLeftWidth: 3, borderLeftColor: C.primary,
    borderWidth: 1, borderColor: '#eee',
  },
  fertLeft: { flex: 1 },
  fertName: { fontSize: 14, fontWeight: '700', color: C.primaryDark, marginBottom: 2 },
  fertPurpose: { fontSize: 12, color: '#666', marginBottom: 2 },
  fertQty: { fontSize: 12, color: '#888' },
  fertCostBox: { backgroundColor: C.accentBg, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, minWidth: 60, alignItems: 'center' },
  fertCost: { fontSize: 12, fontWeight: '700', color: C.primary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CropCheckScreen() {
  const [cropName, setCropName] = useState('');
  const [landSize, setLandSize] = useState('');
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadMsg, setDownloadMsg] = useState('');
  const [cropFocused, setCropFocused] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Mandi Data state
  const [mandiData, setMandiData] = useState(null);

  React.useEffect(() => {
    if (!result) return;
    const fetchMandi = async () => {
      setMandiData({ loading: true, priceData: null, error: false });
      const cropKey = result.crop.toLowerCase();
      let stateName = '';
      try {
        const w = await getWeatherData();
        stateName = w.state || '';
      } catch(e) {}
      
      const prices = await getMandiPrices([cropKey], stateName);
      setMandiData({
        loading: false,
        priceData: prices ? prices[cropKey] : null,
        error: !prices || Object.keys(prices).length === 0
      });
    };
    fetchMandi();
  }, [result]);

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
    const parsedLandSize = parseFloat(landSize) || 1;
    const soilData = Object.fromEntries(FIELDS.map((f) => [f.key, parseFloat(form[f.key])]));
    try {
      setLoading(true);
      setResult(null);
      setDownloadMsg('');
      const data = await checkCrop(cropName.toLowerCase().trim(), soilData);
      
      let fertPlan = null;
      try {
        const fullAnalysis = await analyzeSoil(soilData, parsedLandSize);
        fertPlan = fullAnalysis.fertilizer_plan;
      } catch (err) {}
      
      data.fertilizer_plan = fertPlan;
      data.land_size_acres = parsedLandSize;
      
      setResult(data);
    } catch (error) {
      setErrorMsg(error.message || 'Check Failed. Check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={100}
    >
      {/* ── Hero — matches HomeScreen exactly ── */}
      <View style={styles.hero}>
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        <Text style={styles.heroEmoji}>🌾</Text>
        <Text style={styles.heroTitle}>Crop Check</Text>
        <Text style={styles.heroSub}>फसल जाँचें  ·  ಬೆಳೆ ಪರಿಶೀಲಿಸಿ</Text>

        <View style={styles.goldenLine} />
        <View style={styles.wave} />
      </View>

      <View style={styles.body}>

        {/* ── Land Size ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#0277BD' }]} />
            <Text style={styles.sectionTitle}>📐 Land Size</Text>
          </View>
          <View style={styles.inputRow}>
             <View style={styles.labelBlock}>
               <Text style={styles.inputLabel}>Acres</Text>
               <Text style={styles.inputUnit}>acres</Text>
             </View>
             <TextInput
               style={[styles.input, focusedField === 'landSize' && styles.inputFocused]}
               keyboardType="numeric"
               placeholder="e.g. 5"
               placeholderTextColor={C.placeholder}
               value={landSize}
               onChangeText={setLandSize}
               onFocus={() => setFocusedField('landSize')}
               onBlur={() => setFocusedField(null)}
             />
          </View>
        </View>

        {/* ── Crop Name Card ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#558B2F' }]} />
            <Text style={styles.sectionTitle}>🌾 Crop Name</Text>
          </View>
          <TextInput
            style={[styles.cropInput, cropFocused && styles.inputFocused]}
            placeholder="Enter crop name  (e.g. rice, wheat, maize)"
            placeholderTextColor={C.placeholder}
            value={cropName}
            onChangeText={setCropName}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setCropFocused(true)}
            onBlur={() => setCropFocused(false)}
          />
          <Text style={styles.inputHint}>Type the crop name in English</Text>
        </View>

        {/* ── Soil Values Card ── */}
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
                style={[
                  styles.input,
                  focusedField === key && styles.inputFocused,
                ]}
                keyboardType="numeric"
                placeholder={placeholder}
                placeholderTextColor={C.placeholder}
                value={form[key]}
                onChangeText={(v) => handleChange(key, v)}
                onFocus={() => setFocusedField(key)}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          ))}
        </View>

        {/* ── Error Box ── */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
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

        <Text style={styles.hint}>Enter all 12 soil values for an accurate suitability check.</Text>

        {/* ── Inline Result ── */}
        <ResultCard result={result} mandiData={mandiData} />
        
        {/* ── Download PDF (Only when result exists) ── */}
        {result && (
          <View style={{ marginTop: 16, marginBottom: 30 }}>
            {downloadMsg ? (
              <View style={{ backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#2E7D32' }}>
                <Text style={{ color: '#2E7D32', fontWeight: '600' }}>{downloadMsg}</Text>
              </View>
            ) : null}
            <TouchableOpacity 
              style={{ backgroundColor: C.primaryDark, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 4 }}
              onPress={async () => {
                setDownloadMsg('');
                const uri = await generateCropPdf(result, mandiData);
                if (!uri) return;
                try {
                  if (Platform.OS === 'android') {
                    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                    if (permissions.granted) {
                      const fileName = `KisanMitra_CropCheck_${Date.now()}.pdf`;
                      const base64Uri = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                      const newUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
                      await FileSystem.writeAsStringAsync(newUri, base64Uri, { encoding: FileSystem.EncodingType.Base64 });
                      setDownloadMsg("✅ Report saved! Check your selected folder.");
                    } else {
                      try { await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' }); } catch(err) {}
                    }
                  } else {
                    try { await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' }); } catch(err) {}
                  }
                } catch (e) {
                  Alert.alert('Error', 'Could not save the file: ' + e.message);
                }
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>📄 Download Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  container: { flexGrow: 1 },

  // ── Hero ──
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
  heroEmoji: { fontSize: 30, marginBottom: 8 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: '#ffffff', marginBottom: 4, letterSpacing: 0.3 },
  heroSub:   { fontSize: 13, color: C.subHero, marginBottom: 14 },
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
    paddingBottom: 50,
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
  sectionDot:   { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.primaryDark, flex: 1 },

  // ── Crop name input ──
  cropInput: {
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
  inputHint: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    paddingLeft: 2,
  },

  // ── Soil input rows ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  labelBlock: { flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: C.labelColor, marginBottom: 2 },
  inputUnit:  { fontSize: 11, color: C.unitColor, fontWeight: '500' },
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
  errorIcon: { fontSize: 18, lineHeight: 22 },
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
  ctaDisabled: { backgroundColor: C.disabled, elevation: 0, shadowOpacity: 0 },
  ctaText:  { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  ctaArrow: { fontSize: 22, color: '#fff', fontWeight: '300' },

  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginBottom: 4,
  },
});
