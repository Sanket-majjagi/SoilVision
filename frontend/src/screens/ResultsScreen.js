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
import * as FileSystem from 'expo-file-system/legacy';
import harvestData from '../data/harvest_msp.json';
import { getMandiPrices } from '../services/api';

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
  sublabel:    '#6b8f6b',
  whatsapp:    '#25D366',

  // Score colors by bucket
  scorePoor:   '#D32F2F',
  scoreFair:   '#FF8F00',
  scoreGood:   '#2E7D32',
};

// ---------------------------------------------------------------------------
// Helpers — UNCHANGED
// ---------------------------------------------------------------------------

const RATING_COLORS = {
  Excellent: '#2E7D32',
  Good:      '#66BB6A',
  Fair:      '#FF8F00',
  Poor:      '#D32F2F',
};

const RATING_BG = {
  Excellent: '#E8F5E9',
  Good:      '#F1F8E9',
  Fair:      '#FFF8E1',
  Poor:      '#FFEBEE',
};

const ratingColor = (rating) => RATING_COLORS[rating] ?? '#757575';
const ratingBg    = (rating) => RATING_BG[rating]    ?? '#F5F5F5';

// Score bucket helper (spec: 0-40 Poor, 41-60 Fair, 61-100 Good)
const scoreColor = (score) => {
  if (score <= 40) return C.scorePoor;
  if (score <= 60) return C.scoreFair;
  return C.scoreGood;
};

// ---------------------------------------------------------------------------
// HTML Report Builder — UNCHANGED
// ---------------------------------------------------------------------------

const buildReportHtml = (result, weatherData, mandiData = null) => {
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

  const marketRows = top3Crops.map((c) => {
    const cropKey = c.crop.toLowerCase();
    const mspInfo = harvestData[cropKey];
    const livePrice = mandiData && mandiData[cropKey] ? mandiData[cropKey] : null;
    
    let durationStr = mspInfo ? (mspInfo.duration === "Perennial" ? "Perennial crop" : `Ready in ${mspInfo.duration} months`) : "Expected duration unavailable";
    let mspStr = mspInfo ? `${durationStr}<br/>${mspInfo.type}: ₹${mspInfo.price.toLocaleString('en-IN')} / quintal` : 'Data unavailable';
    let mandiStr = livePrice ? (livePrice.min_price === livePrice.max_price ? `₹${livePrice.min_price}` : `₹${livePrice.min_price} - ₹${livePrice.max_price}`) + `<br/>(${livePrice.matched_state_name})` : 'Unavailable today';
    
    return `
    <tr>
      <td style="text-transform:capitalize;font-weight:bold;">${c.crop}</td>
      <td>${mspStr}</td>
      <td style="color:#2e7d32;font-weight:bold;">${mandiStr}</td>
    </tr>`;
  }).join('');

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
    .weather-row { display: flex; gap: 24px; flex-wrap: wrap; padding: 14px 16px; background: #f1f8e9; border-radius: 8px; border-left: 4px solid #4caf50; }
    .weather-item { font-size: 13px; color: #333; }
    .footer { margin-top: 36px; border-top: 1px solid #ddd; padding-top: 16px; text-align: center; color: #999; font-size: 12px; }
    .footer strong { color: #4caf50; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <h1>🌱 Kisan Mitra Soil Report</h1>
    <p>Farmer's Friend</p>
    <p class="date">Generated on: ${date}</p>
  </div>

  <!-- WEATHER DATA -->
  ${weatherData ? `
  <div class="section">
    <div class="section-title">Weather Data / मौसम डेटा / ಹವಾಮಾನ ಮಾಹಿತಿ</div>
    <div style="display:flex; gap:24px; flex-wrap:wrap; padding:14px 16px; background:#f1f8e9; border-radius:8px; border-left:4px solid #4caf50;">
      <span>📍 <strong>${weatherData.locationName || 'India'}</strong></span>
      <span>🌡️ <strong>${weatherData.temperature}°C</strong></span>
      <span>💧 <strong>${weatherData.humidity}%</strong> Humidity</span>
      <span>🌧️ <strong>${weatherData.rainfall} mm</strong>/yr Rainfall</span>
      <span style="color:#666; font-size:12px;">${weatherData.isReal ? '(Live GPS)' : '(Regional Default)'}</span>
    </div>
  </div>` : ''}

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

  <!-- SECTION 2.5: MARKET FORECAST -->
  <div class="section">
    <div class="section-title">Market & Harvest Forecast / बाज़ार पूर्वानुमान / ಮಾರುಕಟ್ಟೆ ಮುನ್ಸೂಚನೆ</div>
    <table>
      <thead>
        <tr><th>Crop</th><th>Harvest & Govt Price</th><th>Live Mandi Price</th></tr>
      </thead>
      <tbody>${marketRows || '<tr><td colspan="3">No data</td></tr>'}</tbody>
    </table>
    <p style="font-size:12px; color:#666; margin-top:6px; font-style:italic;">* Live mandi prices at time of analysis</p>
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
    <p>Generated by <strong>Kisan Mitra</strong> — Farmer's Friend</p>
    <p style="margin-top:4px;">Data based on ICAR soil health card thresholds · For guidance only</p>
  </div>

</body>
</html>`;
};

// ---------------------------------------------------------------------------
// WeatherCard — compact card below hero, Premium Dark Green theme
// ---------------------------------------------------------------------------

function WeatherCard({ weather }) {
  if (!weather) return null;
  const isReal   = weather.isReal === true;
  const location = weather.locationName || 'India';

  return (
    <View style={styles.weatherCard}>
      {/* Location + live/default badge */}
      <View style={styles.weatherTopRow}>
        <Text style={styles.weatherLocation}>📍 {location}</Text>
        <View style={[styles.weatherBadge, isReal ? styles.badgeLive : styles.badgeDefault]}>
          <Text style={styles.weatherBadgeText}>{isReal ? '🟢 Live' : '🟡 Default'}</Text>
        </View>
      </View>

      {/* Three metric cells */}
      <View style={styles.weatherMetrics}>
        <View style={styles.weatherMetricItem}>
          <Text style={styles.weatherMetricValue}>{weather.temperature}°C</Text>
          <Text style={styles.weatherMetricLabel}>🌡️ Temperature</Text>
        </View>
        <View style={styles.weatherMetricDivider} />
        <View style={styles.weatherMetricItem}>
          <Text style={styles.weatherMetricValue}>{weather.humidity}%</Text>
          <Text style={styles.weatherMetricLabel}>💧 Humidity</Text>
        </View>
        <View style={styles.weatherMetricDivider} />
        <View style={styles.weatherMetricItem}>
          <Text style={styles.weatherMetricValue}>{weather.rainfall}</Text>
          <Text style={styles.weatherMetricLabel}>🌧️ mm/year</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components — logic UNCHANGED, visual presentation updated
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
  const color = scoreColor(score);
  return (
    <View style={[styles.scoreCircle, { borderColor: color }]}>
      <Text style={[styles.scoreNumber, { color }]}>{Math.round(score)}</Text>
      <Text style={styles.scoreSlash}>/100</Text>
    </View>
  );
}

function FertilityCard({ fertility }) {
  if (!fertility) return null;
  const { score = 0, rating = 'Unknown' } = fertility;
  const color = scoreColor(score);
  const desc =
    rating === 'Excellent' ? 'Your soil is in excellent condition!' :
    rating === 'Good'      ? 'Your soil is in good condition.' :
    rating === 'Fair'      ? 'Some nutrients need attention.' :
                             'Significant improvements recommended.';
  return (
    <View style={styles.card}>
      <SectionHeader dot={C.primaryDark} emoji="🌱" title="Soil Fertility Score" />
      <View style={styles.scoreRow}>
        <ScoreCircle score={score} rating={rating} />
        <View style={styles.ratingBlock}>
          <Text style={[styles.ratingText, { color }]}>{rating}</Text>
          <Text style={styles.ratingSubtext}>{desc}</Text>
          <Text style={styles.ratingHint}>Based on ICAR soil health thresholds</Text>
        </View>
      </View>
    </View>
  );
}

function CropCard({ rec, isLast, mandiData }) {
  const matchPct   = Math.round((rec.probability || 0) * 100);
  const rankBg     =
    rec.rank === 1 ? C.primaryDark :
    rec.rank === 2 ? C.heroMid     :
    C.heroLight;

  const cropKey = rec.crop.toLowerCase();
  const mspInfo = harvestData[cropKey];

  return (
    <View style={[styles.cropRow, isLast && styles.cropRowLast]}>
      {/* Rank badge */}
      <View style={[styles.rankBadge, { backgroundColor: rankBg }]}>
        <Text style={styles.rankText}>#{rec.rank}</Text>
      </View>

      {/* Crop info */}
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

        {/* Harvest MSP & Mandi Info */}
        {(mspInfo || mandiData) && (
          <View style={styles.mspContainer}>
            {mspInfo && (
              <>
                <Text style={styles.mspDuration}>⏳ {mspInfo.duration === 'Perennial' ? 'Perennial crop' : `Ready in ${mspInfo.duration} months`}</Text>
                <Text style={styles.mspPrice}>💰 {mspInfo.type}: ₹{mspInfo.price.toLocaleString('en-IN')} per quintal</Text>
              </>
            )}
            
            {/* Live Mandi Price UI */}
            {mandiData && (
              <Text style={styles.mandiPrice}>
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
      </View>

      {/* Confidence badge */}
      <View style={styles.matchBadge}>
        <Text style={styles.matchText}>{matchPct}%</Text>
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
  const [downloadMsg, setDownloadMsg] = React.useState('');
  
  // Feature 2: Mandi Prices state
  const [mandiPrices, setMandiPrices] = React.useState(null);
  const [mandiLoading, setMandiLoading] = React.useState(true);

  React.useEffect(() => {
    if (!result) return;
    const fetchMandi = async () => {
      setMandiLoading(true);
      const crops = (result.crop_recommendations || []).map(r => r.crop);
      const state = result.weather_data?.state || '';
      
      const prices = await getMandiPrices(crops, state);
      setMandiPrices(prices);
      setMandiLoading(false);
    };
    fetchMandi();
  }, [result]);

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

  const { fertility, crop_recommendations = [], fertilizer_plan = {}, weather_data } = result;
  const { land_size_acres = 0, recommendations = [], total_estimated_cost = '—' } = fertilizer_plan;

  // --- PDF generation ---
  const generatePdf = async () => {
    try {
      const html = buildReportHtml(result, result.weather_data, mandiPrices);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      return uri;
    } catch (err) {
      Alert.alert('Error', 'Could not generate PDF: ' + err.message);
      return null;
    }
  };

  const handleDownload = async () => {
    setDownloadMsg('');
    const uri = await generatePdf();
    if (!uri) return;

    try {
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const fileName = `KisanMitra_Report_${Date.now()}.pdf`;
          const base64Uri = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const newUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
          await FileSystem.writeAsStringAsync(newUri, base64Uri, { encoding: FileSystem.EncodingType.Base64 });
          setDownloadMsg("✅ Report saved! Check your selected folder.");
        } else {
          try { await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' }); } catch(err) {}
          setDownloadMsg("");
        }
      } else {
        try { await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' }); } catch(err) {}
        setDownloadMsg("");
      }
    } catch (e) {
      Alert.alert('Download Error', 'Could not save the file: ' + e.message);
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
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero — matches all other screens exactly ── */}
      <View style={styles.hero}>
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        <Text style={styles.heroEmoji}>🌱</Text>
        <Text style={styles.heroTitle}>Analysis Results</Text>
        <Text style={styles.heroSub}>विश्लेषण परिणाम  ·  ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶ</Text>

        <View style={styles.goldenLine} />
        <View style={styles.wave} />
      </View>

      <View style={styles.body}>

        {/* Weather Card — GPS location + live climate data */}
        <WeatherCard weather={result.weather_data} />

        {/* Section 1: Fertility Score */}
        <FertilityCard fertility={fertility} />

        {/* Section 2: Crop Recommendations */}
        <View style={styles.card}>
          <SectionHeader dot={C.primary} emoji="🌾" title="Top 5 Crop Recommendations" />
          {crop_recommendations.length === 0 ? (
            <Text style={styles.emptyText}>No crop data available.</Text>
          ) : (
            crop_recommendations.map((rec, i) => {
              // Pass the specific crop's mandi data perfectly structured
              const cropKey = rec.crop.toLowerCase();
              const cropMandiData = {
                loading: mandiLoading,
                error: !mandiLoading && (!mandiPrices || Object.keys(mandiPrices).length === 0),
                priceData: mandiPrices ? mandiPrices[cropKey] : null,
              };

              return (
                <CropCard
                  key={i}
                  rec={rec}
                  isLast={i === crop_recommendations.length - 1}
                  mandiData={cropMandiData}
                />
              );
            })
          )}
        </View>

        {/* Section 3: Fertilizer Plan */}
        <View style={styles.card}>
          <SectionHeader dot="#E65100" emoji="💊" title="Fertilizer Plan" />

          <View style={styles.landRow}>
            <Text style={styles.landText}>🌍  Land Size: </Text>
            <Text style={styles.landValue}>{land_size_acres} acres</Text>
          </View>

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

        {/* ── Download success box ── */}
        {downloadMsg ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{downloadMsg}</Text>
          </View>
        ) : null}

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
// Styles — premium redesign
// ---------------------------------------------------------------------------

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

  // ── Weather Card ──
  weatherCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  weatherTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weatherLocation: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primaryDark,
    flex: 1,
  },
  weatherBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeLive:    { backgroundColor: '#E8F5E9' },
  badgeDefault: { backgroundColor: '#FFF8E1' },
  weatherBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primaryDark,
  },
  weatherMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  weatherMetricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: C.primaryDark,
    marginBottom: 2,
  },
  weatherMetricLabel: {
    fontSize: 11,
    color: C.sublabel,
    fontWeight: '500',
  },
  weatherMetricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },

  // ── Body ──
  body: {
    padding: 16,
    paddingBottom: 48,
    backgroundColor: C.bg,
  },

  // ── Error state ──
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: C.bg,
  },
  errorEmoji: { fontSize: 48, marginBottom: 12 },
  errorText:  { fontSize: 16, color: C.sublabel, marginBottom: 24 },

  // ── Cards ──
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  // ── Section header ──
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

  // ── Fertility score ──
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  scoreNumber: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  scoreSlash:  { fontSize: 12, color: '#888', fontWeight: '600' },
  ratingBlock: { flex: 1 },
  ratingText:  { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  ratingSubtext: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 6 },
  ratingHint: { fontSize: 11, color: '#888', fontStyle: 'italic' },

  // ── Crop rows ──
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  cropRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rankText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cropInfo: { flex: 1 },
  cropName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.primaryDark,
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  cropPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    backgroundColor: C.accentBg,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: { fontSize: 11, color: C.primary, fontWeight: '600' },
  matchBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 48,
    alignItems: 'center',
  },
  matchText: { fontSize: 13, color: '#888', fontWeight: '700' },
  emptyText: { color: '#aaa', fontStyle: 'italic', paddingVertical: 8 },

  // Harvest MSP
  mspContainer: {
    marginTop: 8,
    gap: 2,
  },
  mspDuration: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  mspPrice: {
    fontSize: 12,
    color: C.primaryDark,
    fontWeight: '700',
  },
  mandiPrice: {
    fontSize: 12,
    color: C.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },

  // ── Land size row ──
  landRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  landText:  { fontSize: 13, color: '#555' },
  landValue: { fontSize: 13, color: '#555', fontWeight: '700' },

  // ── Excellent box ──
  excellentBox: {
    backgroundColor: C.accentBg,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  excellentText: { fontSize: 15, fontWeight: '700', color: C.primary },

  // ── Fertilizer row — white sub-card with green left border ──
  fertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  fertLeft:    { flex: 1 },
  fertName:    { fontSize: 15, fontWeight: '800', color: C.primaryDark, marginBottom: 3 },
  fertPurpose: { fontSize: 12, color: '#666', marginBottom: 3 },
  fertQty:     { fontSize: 12, color: '#888' },
  fertCostBox: {
    backgroundColor: C.accentBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  fertCost: { fontSize: 13, fontWeight: '800', color: C.primary },

  // ── Advisory / warning box ──
  advisoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#E65100',
    gap: 8,
  },
  advisoryIcon: { fontSize: 16 },
  advisoryText: { flex: 1, fontSize: 13, color: '#E65100', lineHeight: 20 },

  // ── Total cost row ──
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1.5,
    borderTopColor: '#EEF4EE',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: C.primaryDark },
  totalCost:  { fontSize: 20, fontWeight: '800', color: C.primaryDark },

  // ── Status box (after download) ──
  statusBox: {
    backgroundColor: C.accentBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.primary,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  statusText: {
    color: C.primaryDark,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // ── Action buttons ──

  // New Analysis — white, green border
  btnOutline: {
    height: 52,
    borderWidth: 2,
    borderColor: C.primaryDark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  btnOutlineText: { fontSize: 17, fontWeight: '800', color: C.primaryDark },

  // Download Report — solid green, elevated
  btnSolid: {
    height: 56,
    backgroundColor: C.primaryDark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 6,
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  btnSolidText: { fontSize: 17, fontWeight: '800', color: '#fff' },

  // Share on WhatsApp — white, WhatsApp green border
  btnWhatsApp: {
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: C.whatsapp,
  },
  btnWhatsAppText: { fontSize: 17, fontWeight: '800', color: C.whatsapp },
});
