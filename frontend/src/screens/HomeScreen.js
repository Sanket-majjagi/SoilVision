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
// Feature card data
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
    accent: '#0277bd',
    accentLight: '#e1f5fe',
  },
  {
    id: 'manual',
    icon: '✏️',
    title: 'Manual Entry',
    titleHi: 'मैन्युअल प्रविष्टि',
    desc: 'Enter soil values from your lab report',
    descKn: 'ನಿಮ್ಮ ಲ್ಯಾಬ್ ರಿಪೋರ್ಟ್ನಿಂದ ಮೌಲ್ಯಗಳನ್ನು ನಮೂದಿಸಿ',
    route: 'ManualEntry',
    accent: '#2e7d32',
    accentLight: '#e8f5e9',
  },
  {
    id: 'colorkit',
    icon: '🎨',
    title: 'Colour Kit',
    titleHi: 'रंग किट',
    desc: 'Select Low / Medium / High from IFFCO kit',
    descKn: 'IFFCO ಕಿಟ್ನಿಂದ ಕಡಿಮೆ/ಮಧ್ಯಮ/ಹೆಚ್ಚು ಆಯ್ಕೆಮಾಡಿ',
    route: 'ColorKit',
    accent: '#e65100',
    accentLight: '#fff3e0',
  },
  {
    id: 'cropcheck',
    icon: '🌾',
    title: 'Check a Crop',
    titleHi: 'फसल जाँचें',
    desc: 'Check if a crop suits your soil conditions',
    descKn: 'ನಿಮ್ಮ ಮಣ್ಣಿಗೆ ಯಾವ ಬೆಳೆ ಸೂಕ್ತ ಎಂದು ತಿಳಿಯಿರಿ',
    route: 'CropCheck',
    accent: '#558b2f',
    accentLight: '#f1f8e9',
  },
];

// ---------------------------------------------------------------------------
// Animated Feature Card
// ---------------------------------------------------------------------------
function FeatureCard({ feature, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();

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

        {/* Icon blob */}
        <View style={[styles.iconBlob, { backgroundColor: feature.accentLight }]}>
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
// Main Screen
// ---------------------------------------------------------------------------
export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#1a5c2e" barStyle="light-content" />

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
          <Text style={styles.appName}>SoilVision</Text>
        </View>

        {/* Tagline — trilingual */}
        <Text style={styles.taglineEn}>AI Soil Analysis for Indian Farmers</Text>
        <Text style={styles.taglineHi}>भारतीय किसानों के लिए AI मिट्टी विश्लेषण</Text>
        <Text style={styles.taglineKn}>ಭಾರತೀಯ ರೈತರಿಗೆ AI ಮಣ್ಣಿನ ವಿಶ್ಲೇಷಣೆ</Text>

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
          <Text style={styles.footerDot}>⬤ ⬤ ⬤</Text>
          <Text style={styles.footerText}>
            Powered by ICAR thresholds · Google Gemini AI
          </Text>
          <Text style={styles.footerSub}>Made for Indian farmers · v1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const HERO_GREEN    = '#1a5c2e';
const HERO_GREEN2   = '#226b38';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f6f4',
  },

  // ── Hero ──
  hero: {
    backgroundColor: HERO_GREEN,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 52,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  decCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: HERO_GREEN2,
    top: -60,
    right: -60,
    opacity: 0.6,
  },
  decCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#2e7d32',
    bottom: 10,
    left: -40,
    opacity: 0.4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  leafCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
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
  taglineHi: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.80)',
    marginBottom: 2,
  },
  taglineKn: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
  },
  wave: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: '#f4f6f4',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // ── Content ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 30,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a3a22',
    marginBottom: 2,
    marginTop: 8,
  },
  sectionSub: {
    fontSize: 12,
    color: '#7a9a7a',
    marginBottom: 18,
  },

  // ── Feature Card ──
  cardWrapper: {
    marginBottom: 14,
    borderRadius: 14,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingRight: 16,
  },
  cardAccentBar: {
    width: 5,
    alignSelf: 'stretch',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    marginRight: 14,
  },
  iconBlob: {
    width: 54,
    height: 54,
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
    color: '#555',
    lineHeight: 18,
  },
  cardDescKn: {
    fontSize: 11,
    color: '#888',
    lineHeight: 16,
    marginTop: 2,
  },
  chevron: {
    fontSize: 30,
    fontWeight: '300',
    marginLeft: 8,
    lineHeight: 34,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#e0e8e0',
  },
  footerDot: {
    fontSize: 6,
    color: '#4caf50',
    letterSpacing: 4,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  footerSub: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 4,
  },
});
