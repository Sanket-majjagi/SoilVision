/**
 * frontend/src/services/api.js
 *
 * Central API service for Kisan Mitra.
 * Weather is auto-fetched here — no screen needs to manually call getWeatherData().
 * All 3 analysis flows (Manual, ColorKit, PhotoScan) get real climate automatically.
 */

import { BASE_URL, ENDPOINTS } from '../constants/api';
import { getWeatherData } from './weather';

// ---------------------------------------------------------------------------
// Shared error handler
// ---------------------------------------------------------------------------
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: 'Network or parsing error' };
    }

    // Properly format FastAPI validation arrays
    if (Array.isArray(errorData.detail)) {
      const msg = errorData.detail.map(e => `${e.loc?.slice(-1)[0]}: ${e.msg}`).join(', ');
      throw new Error(msg);
    }

    throw new Error(errorData.detail || errorData.message || 'API Request Failed');
  }
  return response.json();
};

// ---------------------------------------------------------------------------
// Soil analysis — Manual Entry
// Climate is fetched automatically from GPS. Pass climate explicitly to override.
// ---------------------------------------------------------------------------
export const analyzeSoil = async (soilData, landAcres, climateOverride = null) => {
  // Auto-fetch real weather (uses cache after first call, falls back silently)
  const weather = climateOverride ? null : await getWeatherData();
  const climate = climateOverride ?? {
    temperature: weather.temperature,
    humidity:    weather.humidity,
    rainfall:    weather.rainfall,
  };

  const payload = {
    input_method:    'manual',
    land_size_acres: landAcres,
    soil_data:       soilData,
    climate,
  };

  console.log('📡 analyzeSoil payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}${ENDPOINTS.ANALYZE}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  const result = await handleResponse(response);

  // Attach weather metadata so ResultsScreen can display the weather card
  result.weather_data = climateOverride
    ? { ...climate, locationName: 'Manual', state: '', isReal: false }
    : weather;

  return result;
};

// ---------------------------------------------------------------------------
// Soil analysis — Color Kit
// ---------------------------------------------------------------------------
export const analyzeColorKit = async (readings, landAcres, climateOverride = null) => {
  const weather = climateOverride ? null : await getWeatherData();
  const climate = climateOverride ?? {
    temperature: weather.temperature,
    humidity:    weather.humidity,
    rainfall:    weather.rainfall,
  };

  const payload = {
    land_size_acres: landAcres,
    readings,
    climate,
  };

  const response = await fetch(`${BASE_URL}${ENDPOINTS.COLOR_KIT}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  const result = await handleResponse(response);
  result.weather_data = climateOverride
    ? { ...climate, locationName: 'Manual', state: '', isReal: false }
    : weather;

  return result;
};

// ---------------------------------------------------------------------------
// Vision / Photo Scan
// Centralised here so PhotoScanScreen doesn't need inline fetch logic.
// Weather is injected as Form fields so the backend can use real climate.
// ---------------------------------------------------------------------------
export const analyzeVision = async (imageUri, imageType = 'meter') => {
  // Fetch weather first (cached after first call)
  const weather = await getWeatherData();

  const formData = new FormData();
  formData.append('image_type', imageType);

  // Inject real climate as Form fields (backend vision.py accepts these)
  formData.append('temperature', String(weather.temperature));
  formData.append('humidity',    String(weather.humidity));
  formData.append('rainfall',    String(weather.rainfall));

  // Platform-safe image append
  // On Web, imageUri can be a 'data:' base64 string OR a 'blob:' URL. Both must be fetched as BLOBS.
  if (typeof imageUri === 'string' && (imageUri.startsWith('data:') || imageUri.startsWith('blob:'))) {
    // Web blob/data URL
    const res = await fetch(imageUri);
    const blob = await res.blob();
    formData.append('file', blob, 'soil_photo.jpg');
  } else {
    // Native (Android/iOS)
    formData.append('file', {
      uri:  imageUri,
      type: 'image/jpeg',
      name: 'soil_photo.jpg',
    });
  }

  const response = await fetch(`${BASE_URL}${ENDPOINTS.VISION}`, {
    method:  'POST',
    headers: { Accept: 'application/json' },
    body:    formData,
  });

  if (!response.ok) {
    let errDesc = 'Failed to analyze image.';
    try {
      const errJson = await response.json();
      errDesc = errJson.detail || errJson.message || errDesc;
    } catch (e) { /* ignore parse errors */ }
    throw new Error(errDesc);
  }

  const result = await response.json();

  if (result.success === false) {
    throw new Error(
      'Could not read soil values from this image.\n' +
      'Please make sure the photo clearly shows a soil test meter display or Soil Health Card with visible numbers.\n' +
      'Try Manual Entry instead for best results.'
    );
  }

  // Attach weather metadata for ResultsScreen
  result.weather_data = weather;
  return result;
};

// ---------------------------------------------------------------------------
// Crop suitability check — CropCheckScreen
// ---------------------------------------------------------------------------
export const checkCrop = async (cropName, soilData) => {
  const payload = {
    crop_name: cropName,
    soil_data: soilData,
  };

  const response = await fetch(`${BASE_URL}${ENDPOINTS.CROP_CHECK}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  return handleResponse(response);
};

// ---------------------------------------------------------------------------
// Mandi prices — Feature 2
// ---------------------------------------------------------------------------
export const getMandiPrices = async (cropNames, state = '') => {
  try {
    const params = new URLSearchParams({
      crops: Array.isArray(cropNames) ? cropNames.join(',') : cropNames,
      ...(state ? { state } : {}),
    });

    const response = await fetch(`${BASE_URL}${ENDPOINTS.MARKET_PRICES}?${params}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      return {};
    }
    return await response.json();
  } catch (e) {
    console.warn('[Kisan Mitra] Mandi API fetch failed silently', e);
    return {};
  }
};
