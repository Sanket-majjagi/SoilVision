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
import { BASE_URL, ENDPOINTS } from '../constants/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  hero: '#1a5c2e', primary: '#2e7d32', accent: '#4caf50', accentLt: '#e8f5e9',
  bg: '#f0f4f0', card: '#ffffff', label: '#1a3a22', sublabel: '#6b8f6b',
  disabled: '#81c784',
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  // 2. Upload API call
  const handleAnalyze = async () => {
    if (!imageUri) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image_type', 'meter');

      // Setup platform-safe FormData appending
      if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        formData.append('file', blob, 'soil_photo.jpg');
      } else {
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'soil_photo.jpg',
        });
      }

      const response = await fetch(`${BASE_URL}${ENDPOINTS.VISION}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });

      if (!response.ok) {
        let errDesc = 'Failed to analyze image.';
        try {
          const errJson = await response.json();
          errDesc = errJson.detail || errJson.message || errDesc;
        } catch (e) {}
        throw new Error(errDesc);
      }

      const result = await response.json();

      // Ensure API explicitly returned success before navigating
      // If the backend vision AI script returns success: false it will be caught here
      if (result.success === false) {
        throw new Error(
          "Could not read soil values from this image.\nPlease make sure the photo clearly shows a soil test meter display or Soil Health Card with visible numbers.\nTry Manual Entry instead for best results."
        );
      }

      // The backend Vision AI might return a nested 'resultData' via analyze endpoint proxy,
      // But typically we pass the root object. Let's pass root to ResultsScreen.
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
      {/* ── Section 1: Hero ── */}
      <View style={styles.hero}>
        <View style={styles.decCircle} />
        <Text style={styles.heroEmoji}>📷</Text>
        <Text style={styles.heroTitle}>Photo Scan</Text>
        <Text style={styles.heroSub}>फोटो स्कैन  ·  ಫೋಟೋ ಸ್ಕ್ಯಾನ್</Text>
      </View>

      <View style={styles.body}>

        {/* ── Section 2: Instructions ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.instructionText}>
            Take a clear photo of your soil test meter display or Soil Health Card.
          </Text>
          <View style={styles.tipsRow}>
            <Text style={styles.tipItem}>💡 Good lighting</Text>
            <Text style={styles.tipItem}>🤚 Hold camera steady</Text>
            <Text style={styles.tipItem}>✅ Make sure values are visible</Text>
          </View>
        </View>

        {/* ── Section 3: Image Picker ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#0277bd' }]} />
            <Text style={styles.sectionTitle}>Image Selection</Text>
          </View>

          <View style={styles.pickerRow}>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(true)}>
              <Text style={styles.pickerBtnText}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerBtnAlt} onPress={() => pickImage(false)}>
              <Text style={styles.pickerBtnAltText}>🖼️ Choose from Gallery</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            </View>
          )}
        </View>

        {/* ── Error Box ── */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* ── Section 4: Analyse Button ── */}
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

        {/* ── Section 5: Note Card ── */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            💡 For best results, use <Text style={{fontWeight: 'bold'}}>Manual Entry</Text> if photo is unclear.
          </Text>
        </View>

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
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.70)' },

  // Body
  body: {
    padding: 16, paddingBottom: 50, marginTop: -20,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: C.bg,
  },

  // Cards
  sectionCard: {
    backgroundColor: C.card, borderRadius: 16,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
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

  // Instructions
  instructionText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.label,
    marginBottom: 12,
    lineHeight: 22,
  },
  tipsRow: { gap: 6 },
  tipItem: { fontSize: 13, color: '#555', fontWeight: '500' },

  // Picker
  pickerRow: { gap: 10, marginBottom: 4 },
  pickerBtn: {
    backgroundColor: '#0277bd',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickerBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  pickerBtnAlt: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e1f5fe',
    alignItems: 'center',
  },
  pickerBtnAltText: { color: '#0277bd', fontSize: 15, fontWeight: '800' },
  
  // Preview
  previewContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#eef4ee',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
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
    marginBottom: 16,
  },
  ctaDisabled: { backgroundColor: C.disabled, elevation: 0, shadowOpacity: 0 },
  ctaText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  ctaArrow: { fontSize: 22, color: '#fff', fontWeight: '300' },

  // Note Box
  noteBox: {
    backgroundColor: C.accentLt,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: C.accent,
  },
  noteText: {
    fontSize: 13,
    color: C.primary,
    lineHeight: 20,
  },
});
