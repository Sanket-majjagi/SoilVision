import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// ─── Design tokens (matches other screens) ────────────────────────────────────
const C = {
  hero:     '#1a5c2e',
  primary:  '#2e7d32',
  accent:   '#4caf50',
  accentLt: '#e8f5e9',
  bg:       '#f0f4f0',
  card:     '#ffffff',
  label:    '#1a3a22',
  sublabel: '#6b8f6b',
};

// ---------------------------------------------------------------------------
// Helpers — UNCHANGED
// ---------------------------------------------------------------------------

const RATING_COLORS = {
  Excellent: '#2e7d32',
  Good:      '#66bb6a',
  Fair:      '#ff9800',
  Poor:      '#f44336',
};

const RATING_BG = {
  Excellent: '#e8f5e9',
  Good:      '#f1f8e9',
  Fair:      '#fff3e0',
  Poor:      '#ffebee',
};

const ratingColor = (rating) => RATING_COLORS[rating] ?? '#757575';
const ratingBg    = (rating) => RATING_BG[rating]    ?? '#f5f5f5';

// ---------------------------------------------------------------------------
// HTML Report Builder — UNCHANGED
// ---------------------------------------------------------------------------

const buildReportHtml = (result) => {
  const { fertility, crop_recommendations = [], fertilizer_plan = {} } = result;
  const { score = 0, rating = '—' } = fertility ?? {};
  const { land_size_acres = 0, recommendations = [], total_estimated_cost = '—' } = fertilizer_plan;
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const ratingColorHex = RATING_COLORS[rating] ?? '#757575';

  const top3Crops = crop_recommendations.slice(0, 3);
  const cropRows = top3Crops.map((c) => `
    <tr>
      <td>${c.rank}</td>
      <td style="text-transform:capitalize;font-weight:bold;">${c.crop}</td>
      <td>${c.season ?? '—'}</td>
      <td>${c.ideal_ph ?? '—'}</td>
    </tr>`).join('');

  const fertRows = recommendations
    .filter((r) => r.fertilizer !== 'Advisory')
    .map((r) => `
    <tr>
      <td style="font-weight:bold;">${r.fertilizer}</td>
      <td>${r.qty_per_acre_kg ?? '—'} kg</td>
      <td>${r.total_qty_kg ?? '—'} kg</td>
      <td style="color:#2e7d32;font-weight:bold;">${r.estimated_cost}</td>
    </tr>`).join('');

  const advisories = recommendations
    .filter((r) => r.fertilizer === 'Advisory')
    .map((r) => `<li>${r.purpose}</li>`).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SoilVision Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #222; background: #fff; padding: 32px; }
    .header { background: #4caf50; color: #fff; padding: 24px 28px; border-radius: 10px; margin-bottom: 28px; }
    .header h1 { font-size: 28px; letter-spacing: 1px; }
    .header p  { font-size: 14px; margin-top: 6px; opacity: 0.9; }
    .date { font-size: 13px; opacity: 0.8; margin-top: 4px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 16px; font-weight: bold; color: #4caf50; border-bottom: 2px solid #4caf50; padding-bottom: 6px; margin-bottom: 14px; }
    .trilingual { font-size: 13px; color: #666; margin-bottom: 12px; }
    .score-box { display: flex; align-items: center; gap: 20px; padding: 16px; background: #f9f9f9; border-radius: 8px; border-left: 6px solid ${ratingColorHex}; }
    .score-number { font-size: 56px; font-weight: bold; color: ${ratingColorHex}; line-height: 1; }
    .score-meta { font-size: 13px; color: #555; margin-top: 4px; }
    .rating-label { font-size: 26px; font-weight: bold; color: ${ratingColorHex}; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { background: #4caf50; color: #fff; padding: 10px 12px; text-align: left; font-size: 13px; }
    td { padding: 9px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .total-row { display: flex; justify-content: space-between; align-items: center; background: #e8f5e9; padding: 14px 16px; border-radius: 8px; margin-top: 14px; }
    .total-label { font-size: 16px; font-weight: bold; color: #333; }
    .total-value { font-size: 22px; font-weight: bold; color: #2e7d32; }
    .advisories { background: #fff8e1; border-left: 4px solid #ff9800; padding: 12px 16px; border-radius: 6px; margin-top: 14px; }
    .advisories ul { padding-left: 18px; margin-top: 6px; }
    .advisories li { font-size: 13px; color: #e65100; margin-bottom: 4px; }
    .footer { margin-top: 36px; border-top: 1px solid #ddd; padding-top: 16px; text-align: center; color: #999; font-size: 12px; }
    .footer strong { color: #4caf50; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <h1>🌱 SoilVision Soil Report</h1>
    <p>AI Soil Analysis for Indian Farmers</p>
    <p class="date">Generated on: ${date}</p>
  </div>

  <!-- SECTION 1: FERTILITY SCORE -->
  <div class="section">
    <div class="section-title">Soil Fertility Score / मिट्टी उर्वरता स्कोर / ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಸ್ಕೋರ್</div>
    <div class="score-box">
      <div class="score-number">${Math.round(score)}</div>
      <div>
        <div class="rating-label">${rating}</div>
        <div class="score-meta">Score out of 100 based on ICAR thresholds</div>
        <div class="score-meta">Land Size: ${land_size_acres} acres</div>
      </div>
    </div>
  </div>

  <!-- SECTION 2: TOP CROPS -->
  <div class="section">
    <div class="section-title">Recommended Crops / अनुशंसित फसलें / ಶಿಫಾರಸು ಮಾಡಿದ ಬೆಳೆಗಳು</div>
    <table>
      <thead>
        <tr><th>#</th><th>Crop</th><th>Season</th><th>Ideal pH</th></tr>
      </thead>
      <tbody>${cropRows || '<tr><td colspan="4">No data</td></tr>'}</tbody>
    </table>
  </div>

  <!-- SECTION 3: FERTILIZER PLAN -->
  <div class="section">
    <div class="section-title">Fertilizer Plan / उर्वरक योजना / ಗೊಬ್ಬರ ಯೋಜನೆ</div>
    ${fertRows ? `
    <table>
      <thead>
        <tr><th>Fertilizer</th><th>Qty / Acre</th><th>Total Qty</th><th>Cost</th></tr>
      </thead>
      <tbody>${fertRows}</tbody>
    </table>` : '<p style="color:#2e7d32;font-weight:bold;padding:12px;">✅ Your soil is excellent! No fertilizer needed this season.</p>'}

    ${advisories ? `
    <div class="advisories">
      <strong>⚠️ Advisories:</strong>
      <ul>${advisories}</ul>
    </div>` : ''}

    <div class="total-row">
      <span class="total-label">Total Cost / कुल लागत / ಒಟ್ಟು ವೆಚ್ಚ</span>
      <span class="total-value">${total_estimated_cost}</span>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <p>Generated by <strong>SoilVision</strong> — AI Soil Analysis for Indian Farmers</p>
    <p style="margin-top:4px;">Data based on ICAR soil health card thresholds · For guidance only</p>
  </div>

</body>
</html>`;
};

// ---------------------------------------------------------------------------
// Sub-components — logic UNCHANGED, styling updated
// ---------------------------------------------------------------------------

function SectionHeader({ dot, emoji, title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: dot }]} />
      <Text style={styles.sectionTitle}>{emoji} {title}</Text>
    </View>
  );
}

function ScoreCircle({ score, rating }) {
  const color = ratingColor(rating);
  return (
    <View style={[styles.scoreCircle, { borderColor: color }]}>
      <Text style={[styles.scoreNumber, { color }]}>{Math.round(score)}</Text>
      <Text style={styles.scoreLabel}>/ 100</Text>
    </View>
  );
}

function FertilityCard({ fertility }) {
  if (!fertility) return null;
  const { score = 0, rating = 'Unknown' } = fertility;
  const color = ratingColor(rating);
  const bg    = ratingBg(rating);
  return (
    <View style={[styles.card, { backgroundColor: bg, borderLeftWidth: 5, borderLeftColor: color }]}>
      <SectionHeader dot={color} emoji="🌱" title="Soil Fertility Score" />
      <View style={styles.scoreRow}>
        <ScoreCircle score={score} rating={rating} />
        <View style={styles.ratingBlock}>
          <Text style={[styles.ratingText, { color }]}>{rating}</Text>
          <Text style={styles.ratingSubtext}>
            {rating === 'Excellent'
              ? 'Your soil is in excellent condition!'
              : rating === 'Good'
              ? 'Your soil is in good condition.'
              : rating === 'Fair'
              ? 'Some nutrients need attention.'
              : 'Significant improvements recommended.'}
          </Text>
          <Text style={styles.ratingHint}>Based on ICAR soil health thresholds</Text>
        </View>
      </View>
    </View>
  );
}

function CropCard({ rec }) {
  const matchPct = Math.round((rec.probability || 0) * 100);
  const matchColor = matchPct >= 70 ? C.primary : matchPct >= 40 ? '#ff9800' : '#9e9e9e';
  return (
    <View style={styles.cropCard}>
      <View style={[styles.rankBadge, { backgroundColor: rec.rank === 1 ? C.primary : '#8bc34a' }]}>
        <Text style={styles.rankText}>#{rec.rank}</Text>
      </View>
      <View style={styles.cropInfo}>
        <Text style={styles.cropName}>
          {rec.crop.charAt(0).toUpperCase() + rec.crop.slice(1)}
        </Text>
        <View style={styles.cropPills}>
          {rec.season ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>📅 {rec.season}</Text>
            </View>
          ) : null}
          {rec.ideal_ph ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>pH {rec.ideal_ph}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={[styles.matchBadge, { backgroundColor: matchColor + '18', borderColor: matchColor }]}>
        <Text style={[styles.matchText, { color: matchColor }]}>{matchPct}%</Text>
      </View>
    </View>
  );
}

function FertilizerRow({ rec }) {
  if (!rec.fertilizer || rec.fertilizer === 'Advisory') {
    return (
      <View style={styles.advisoryRow}>
        <Text style={styles.advisoryIcon}>⚠️</Text>
        <Text style={styles.advisoryText}>{rec.purpose}</Text>
      </View>
    );
  }
  return (
    <View style={styles.fertRow}>
      <View style={styles.fertLeft}>
        <Text style={styles.fertName}>{rec.fertilizer}</Text>
        <Text style={styles.fertPurpose}>{rec.purpose}</Text>
        {rec.qty_per_acre_kg != null && (
          <Text style={styles.fertQty}>
            {rec.qty_per_acre_kg} kg/acre  ·  Total {rec.total_qty_kg} kg
          </Text>
        )}
      </View>
      <View style={styles.fertCostBox}>
        <Text style={styles.fertCost}>{rec.estimated_cost}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen — logic UNCHANGED
// ---------------------------------------------------------------------------

export default function ResultsScreen({ route, navigation }) {
  const result = route?.params?.resultData;

  if (!result) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>🌱</Text>
        <Text style={styles.errorText}>No result data found.</Text>
        <TouchableOpacity style={styles.btnSolid} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.btnSolidText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { fertility, crop_recommendations = [], fertilizer_plan = {} } = result;
  const { land_size_acres = 0, recommendations = [], total_estimated_cost = '—' } = fertilizer_plan;

  // --- PDF generation --- UNCHANGED
  const generatePdf = async () => {
    try {
      const html = buildReportHtml(result);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      return uri;
    } catch (err) {
      Alert.alert('Error', 'Could not generate PDF: ' + err.message);
      return null;
    }
  };

  const handleDownload = async () => {
    const uri = await generatePdf();
    if (!uri) return;
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save SoilVision Report',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Saved', `Report saved to:\n${uri}`);
    }
  };

  const handleWhatsApp = async () => {
    const uri = await generatePdf();
    if (!uri) return;
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
      return;
    }
    // Share sheet — WhatsApp will appear if installed
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share SoilVision Report on WhatsApp',
      UTI: 'com.adobe.pdf',
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Hero Banner ── */}
      <View style={styles.hero}>
        <View style={styles.decCircle} />
        <Text style={styles.heroEmoji}>🌱</Text>
        <Text style={styles.heroTitle}>Analysis Results</Text>
        <Text style={styles.heroSub}>विश्लेषण परिणाम  ·  ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶ</Text>
      </View>

      <View style={styles.body}>

        {/* Section 1: Fertility */}
        <FertilityCard fertility={fertility} />

        {/* Section 2: Crop Recommendations */}
        <View style={styles.card}>
          <SectionHeader dot={C.primary} emoji="🌾" title="Top 5 Crop Recommendations" />
          {crop_recommendations.length === 0 ? (
            <Text style={styles.emptyText}>No crop data available.</Text>
          ) : (
            crop_recommendations.map((rec, i) => (
              <CropCard key={i} rec={rec} />
            ))
          )}
        </View>

        {/* Section 3: Fertilizer Plan */}
        <View style={styles.card}>
          <SectionHeader dot="#e65100" emoji="💊" title="Fertilizer Plan" />
          <Text style={styles.landText}>🌍 Land Size: {land_size_acres} acres</Text>
          {recommendations.length === 0 ? (
            <View style={styles.excellentBox}>
              <Text style={styles.excellentText}>
                ✅ Your soil is excellent! No fertilizer needed this season.
              </Text>
            </View>
          ) : (
            <>
              {recommendations.map((rec, i) => (
                <FertilizerRow key={i} rec={rec} />
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Estimated Cost</Text>
                <Text style={styles.totalCost}>{total_estimated_cost}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Action Buttons ── */}
        <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.btnOutlineText}>🔄 New Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSolid} onPress={handleDownload}>
          <Text style={styles.btnSolidText}>📄 Download Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnWhatsApp} onPress={handleWhatsApp}>
          <Text style={styles.btnWhatsAppText}>💬 Share on WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Hero ──
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
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  // ── Body ──
  body: {
    padding: 16, paddingBottom: 48, marginTop: -20,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: C.bg,
  },
  container: {},

  // ── Error ──
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 24, backgroundColor: C.bg,
  },
  errorEmoji: { fontSize: 48, marginBottom: 12 },
  errorText:  { fontSize: 16, color: C.sublabel, marginBottom: 24 },

  // ── Cards ──
  card: {
    backgroundColor: C.card, borderRadius: 16,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    marginBottom: 14, elevation: 3,
    shadowColor: '#1a5c2e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#eef4ee',
  },
  sectionDot:  { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', color: C.label },

  // ── Fertility score ──
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreCircle: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 6, justifyContent: 'center', alignItems: 'center',
    marginRight: 20, backgroundColor: '#fff',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  scoreNumber: { fontSize: 32, fontWeight: '800' },
  scoreLabel:  { fontSize: 11, color: '#aaa', fontWeight: '600' },
  ratingBlock: { flex: 1 },
  ratingText:  { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  ratingSubtext: { fontSize: 14, color: '#555', lineHeight: 20 },
  ratingHint: { fontSize: 11, color: C.sublabel, marginTop: 4 },

  // ── Crop card ──
  cropCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.accentLt, borderRadius: 12,
    padding: 12, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: C.accent,
  },
  rankBadge: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rankText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cropInfo: { flex: 1 },
  cropName: {
    fontSize: 16, fontWeight: '800', color: C.primary,
    textTransform: 'capitalize', marginBottom: 6,
  },
  cropPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#d0e4d0',
  },
  pillText: { fontSize: 11, color: C.sublabel, fontWeight: '600' },
  matchBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1.5,
    minWidth: 48, alignItems: 'center',
  },
  matchText: { fontSize: 13, fontWeight: '800' },
  emptyText: { color: '#aaa', fontStyle: 'italic' },

  // ── Land text ──
  landText: {
    fontSize: 13, fontWeight: '600', color: C.sublabel,
    marginBottom: 12,
  },

  // ── Excellent box ──
  excellentBox: {
    backgroundColor: C.accentLt, borderRadius: 10,
    padding: 14, borderLeftWidth: 4, borderLeftColor: C.accent,
  },
  excellentText: { fontSize: 15, fontWeight: '700', color: C.primary },

  // ── Fertilizer row ──
  fertRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f7faf7', borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: '#d0e4d0',
  },
  fertLeft: { flex: 1 },
  fertName: { fontSize: 15, fontWeight: '800', color: C.label, marginBottom: 3 },
  fertPurpose: { fontSize: 12, color: C.sublabel, marginBottom: 3 },
  fertQty: { fontSize: 12, color: '#777' },
  fertCostBox: {
    backgroundColor: C.accentLt, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#a5d6a7',
    alignItems: 'center', justifyContent: 'center',
    minWidth: 72,
  },
  fertCost: { fontSize: 14, fontWeight: '800', color: C.primary },

  // ── Advisory ──
  advisoryRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff8e1', borderRadius: 10,
    padding: 12, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: '#ff9800', gap: 8,
  },
  advisoryIcon: { fontSize: 16 },
  advisoryText: { flex: 1, fontSize: 13, color: '#e65100', lineHeight: 20 },

  // ── Total row ──
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1.5, borderTopColor: '#d0e4d0',
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: C.label },
  totalCost:  { fontSize: 22, fontWeight: '800', color: C.primary },

  // ── Buttons ──
  btnOutline: {
    borderWidth: 2, borderColor: C.primary,
    paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 12,
    backgroundColor: '#fff',
  },
  btnOutlineText: { fontSize: 17, fontWeight: '800', color: C.primary },

  btnSolid: {
    backgroundColor: C.primary,
    paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 12,
    elevation: 5, shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  btnSolidText: { fontSize: 17, fontWeight: '800', color: '#fff' },

  btnWhatsApp: {
    backgroundColor: '#fff',
    paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: C.accent,
    elevation: 1,
  },
  btnWhatsAppText: { fontSize: 17, fontWeight: '800', color: C.accent },
});
