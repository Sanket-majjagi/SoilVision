import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { analyzeVision } from '../services/api';

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
  disabled:    '#81c784',
  errorBg:     '#ffffff',
  errorBdr:    '#D32F2F',
  errorText:   '#D32F2F',
};

export default function PhotoScanScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Image Picker Logic
  const pickImage = async (useCamera) => {
    setErrorMsg('');
    let result;
    const options = {
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    };

    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Camera permission is required to take photos.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Gallery permission is required to choose photos.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 2. Analyse via centralised api.js (weather auto-injected)
  const handleAnalyze = async () => {
    if (!imageUri) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await analyzeVision(imageUri, 'meter');
      navigation.navigate('Results', { resultData: result });
    } catch (error) {
      setErrorMsg(error.message || 'Network error while analyzing photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero — matches HomeScreen exactly ── */}
      <View style={styles.hero}>
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        <Text style={styles.heroEmoji}>📷</Text>
        <Text style={styles.heroTitle}>Photo Scan</Text>
        <Text style={styles.heroSub}>फोटो स्कैन  ·  ಫೋಟೋ ಸ್ಕ್ಯಾನ್</Text>

        <View style={styles.goldenLine} />
        <View style={styles.wave} />
      </View>

      <View style={styles.body}>

        {/* ── Instructions Card ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#0277BD' }]} />
            <Text style={styles.sectionTitle}>📋 Instructions</Text>
          </View>
          <Text style={styles.instructionText}>
            Take a clear photo of your soil test meter display or Soil Health Card.
          </Text>
          <View style={styles.tipsRow}>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={styles.tipText}>Good lighting</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>🤚</Text>
              <Text style={styles.tipText}>Hold camera steady</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>✅</Text>
              <Text style={styles.tipText}>Values must be visible</Text>
            </View>
          </View>
        </View>

        {/* ── Image Selection Card ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: C.primary }]} />
            <Text style={styles.sectionTitle}>🖼️ Image Selection</Text>
          </View>

          <View style={styles.pickerRow}>
            <TouchableOpacity style={styles.pickerBtnCamera} onPress={() => pickImage(true)} activeOpacity={0.85}>
              <Text style={styles.pickerBtnCameraText}>📷  Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerBtnGallery} onPress={() => pickImage(false)} activeOpacity={0.85}>
              <Text style={styles.pickerBtnGalleryText}>🖼️  Gallery</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>✓ Photo selected</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Error Box — matches ManualEntryScreen ── */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ── Analyse Button — only shown after image selected ── */}
        {imageUri ? (
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
                <Text style={styles.ctaText}>Analyse Photo</Text>
                <Text style={styles.ctaArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}

        {/* ── Info Banner ── */}
        <View style={styles.noteBox}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <Text style={styles.noteText}>
            For best results, use <Text style={styles.noteLink}>Manual Entry</Text> if the photo is unclear or values are hard to read.
          </Text>
        </View>

      </View>
    </ScrollView>
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
    paddingBottom: 16,
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

  // ── Instructions ──
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 14,
    lineHeight: 22,
  },
  tipsRow: { gap: 8 },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipEmoji: { fontSize: 15, width: 22 },
  tipText:  { fontSize: 13, color: '#555', fontWeight: '500' },

  // ── Image picker buttons ──
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  pickerBtnCamera: {
    flex: 1,
    backgroundColor: C.primaryDark,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  pickerBtnCameraText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  pickerBtnGallery: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.primary,
    alignItems: 'center',
  },
  pickerBtnGalleryText: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '800',
  },

  // ── Preview ──
  previewContainer: {
    marginTop: 14,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 210,
    resizeMode: 'cover',
  },
  previewBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(27,94,32,0.90)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  previewBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 16,
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

  // ── Info banner ──
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.accentBg,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.primaryDark,
    gap: 8,
    marginBottom: 20,
  },
  noteIcon: { fontSize: 16 },
  noteText: { flex: 1, fontSize: 13, color: C.primaryDark, lineHeight: 20 },
  noteLink: { fontWeight: '700', textDecorationLine: 'underline' },
});
