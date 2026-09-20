import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';

// ---------------------------------------------------------------------------
// Feature card data — accent colors updated to spec
// ---------------------------------------------------------------------------
const FEATURES = [
  {
    id: 'photo',
    icon: '📷',
    title: 'Photo Scan',
    titleHi: 'फोटो स्कैन',
    desc: 'Photograph your soil meter or Soil Health Card',
    descKn: 'ನಿಮ್ಮ ಮಣ್ಣಿನ ಮೀಟರ್ ಫೋಟೋ ತೆಗೆಯಿರಿ',
    route: 'PhotoScan',
    accent: '#1565C0',
  },
  {
    id: 'manual',
    icon: '✏️',
    title: 'Manual Entry',
    titleHi: 'मैन्युअल प्रविष्टि',
    desc: 'Enter soil values from your lab report',
    descKn: 'ನಿಮ್ಮ ಲ್ಯಾಬ್ ರಿಪೋರ್ಟ್ನಿಂದ ಮೌಲ್ಯಗಳನ್ನು ನಮೂದಿಸಿ',
    route: 'ManualEntry',
    accent: '#2E7D32',
  },
  {
    id: 'colorkit',
    icon: '🎨',
    title: 'Colour Kit',
    titleHi: 'रंग किट',
    desc: 'Select Low / Medium / High from IFFCO kit',
    descKn: 'IFFCO ಕಿಟ್ನಿಂದ ಕಡಿಮೆ/ಮಧ್ಯಮ/ಹೆಚ್ಚು ಆಯ್ಕೆಮಾಡಿ',
    route: 'ColorKit',
    accent: '#E65100',
  },
  {
    id: 'cropcheck',
    icon: '🌾',
    title: 'Check a Crop',
    titleHi: 'फसल जाँचें',
    desc: 'Check if a crop suits your soil conditions',
    descKn: 'ನಿಮ್ಮ ಮಣ್ಣಿಗೆ ಯಾವ ಬೆಳೆ ಸೂಕ್ತ ಎಂದು ತಿಳಿಯಿರಿ',
    route: 'CropCheck',
    accent: '#2E7D32',
  },
];

// Convert hex accent to rgba for soft 15% tinted icon blob backgrounds
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------------------
// Animated Feature Card — layout untouched, styles refined
// ---------------------------------------------------------------------------
function FeatureCard({ feature, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();

  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Left accent bar */}
        <View style={[styles.cardAccentBar, { backgroundColor: feature.accent }]} />

        {/* Icon blob — 15% tinted bg */}
        <View style={[styles.iconBlob, { backgroundColor: hexToRgba(feature.accent, 0.12) }]}>
          <Text style={styles.iconEmoji}>{feature.icon}</Text>
        </View>

        {/* Text */}
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: feature.accent }]}>{feature.title}</Text>
          <Text style={styles.cardTitleHi}>{feature.titleHi}</Text>
          <Text style={styles.cardDesc}>{feature.desc}</Text>
          <Text style={styles.cardDescKn}>{feature.descKn}</Text>
        </View>

        {/* Chevron */}
        <Text style={[styles.chevron, { color: feature.accent }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen — navigation logic 100% unchanged
// ---------------------------------------------------------------------------
export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      {/* ── HERO HEADER ── */}
      <View style={styles.hero}>
        {/* Decorative circles */}
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        {/* Logo row */}
        <View style={styles.logoRow}>
          <View style={styles.leafCircle}>
            <Text style={styles.leafEmoji}>🌱</Text>
          </View>
          <Text style={styles.appName}>Kisan Mitra</Text>
        </View>

        {/* Tagline — trilingual */}
        <Text style={styles.taglineEn}>Farmer's Friend</Text>
        <Text style={styles.taglineMulti}>किसान मित्र · ರೈತನ ಗೆಳೆಯ</Text>

        {/* Premium golden accent line */}
        <View style={styles.goldenLine} />

        {/* Wave divider */}
        <View style={styles.wave} />
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeading}>Choose Analysis Method</Text>
        <Text style={styles.sectionSub}>विश्लेषण विधि चुनें  ·  ವಿಶ್ಲೇಷಣೆ ವಿಧಾನ ಆಯ್ಕೆಮಾಡಿ</Text>

        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            onPress={() => navigation.navigate(feature.route)}
          />
        ))}

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2026 Kisan Mitra. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — premium redesign
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6F4',
  },

  // ── Hero ──
  hero: {
    backgroundColor: '#1B5E20',
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leafCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  leafEmoji: {
    fontSize: 26,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  taglineEn: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    marginBottom: 4,
  },
  taglineMulti: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 14,
  },
  goldenLine: {
    width: 60,
    height: 2,
    backgroundColor: '#C8A951',
    borderRadius: 2,
    marginBottom: 4,
  },
  wave: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: '#F4F6F4',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // ── Content ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 3,
    marginTop: 8,
  },
  sectionSub: {
    fontSize: 13,
    color: '#5D8A65',
    marginBottom: 18,
  },

  // ── Feature Card ──
  cardWrapper: {
    marginBottom: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#fff',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 18,
    paddingRight: 16,
  },
  cardAccentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    marginRight: 14,
  },
  iconBlob: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconEmoji: {
    fontSize: 26,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 1,
  },
  cardTitleHi: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
    marginTop: 3,
  },
  cardDescKn: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '400',
    marginLeft: 8,
    lineHeight: 24,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 18,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e8e0',
  },
  copyright: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
  },
});


