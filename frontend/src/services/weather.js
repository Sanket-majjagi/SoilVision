/**
 * frontend/src/services/weather.js
 *
 * Central weather service for Kisan Mitra.
 * - Gets farmer's GPS location via expo-location
 * - Calls backend proxy GET /api/v1/weather (keeps API key safe)
 * - Caches result for the session (fetches once, reused everywhere)
 * - On ANY failure → returns DEFAULT_CLIMATE silently (app never breaks)
 *
 * Usage:
 *   import { getWeatherData } from './weather';
 *   const weather = await getWeatherData();
 *   // { temperature, humidity, rainfall, locationName, state, isReal }
 */

import * as Location from 'expo-location';
import { BASE_URL, ENDPOINTS } from '../constants/api';

// ---------------------------------------------------------------------------
// Fallback — matches old hardcoded values exactly
// ---------------------------------------------------------------------------
const DEFAULT_CLIMATE = {
  temperature: 28.5,
  humidity:    72.0,
  rainfall:    1200.0,
  locationName: 'India',
  state:        '',
  isReal:       false,   // Flag: false = fallback, true = live GPS data
};

// ---------------------------------------------------------------------------
// In-memory cache — fetched once per app session
// ---------------------------------------------------------------------------
let _cachedWeather = null;
let _fetchPromise  = null;   // Prevents duplicate simultaneous fetches

// ---------------------------------------------------------------------------
// Internal: fetch weather from backend proxy
// ---------------------------------------------------------------------------
async function _fetchFromBackend(lat, lon) {
  console.log(`[Kisan Mitra] GPS Location Acquired: lat=${lat}, lon=${lon}`);
  const url = `${BASE_URL}${ENDPOINTS.WEATHER}?lat=${lat}&lon=${lon}`;
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Weather API returned ${response.status}`);
  }

  const data = await response.json();
  console.log(`[Kisan Mitra] Weather API Resolved state as: ${data.state || 'Unknown'}`);
  return {
    temperature:  typeof data.temperature === 'number' ? data.temperature : DEFAULT_CLIMATE.temperature,
    humidity:     typeof data.humidity    === 'number' ? data.humidity    : DEFAULT_CLIMATE.humidity,
    rainfall:     typeof data.rainfall    === 'number' ? data.rainfall    : DEFAULT_CLIMATE.rainfall,
    locationName: data.location_name || 'India',
    state:        data.state         || '',
    isReal:       true,
  };
}

// ---------------------------------------------------------------------------
// Internal: get GPS coordinates with timeout
// ---------------------------------------------------------------------------
async function _getCoordinates() {
  // Race between actual GPS fetch and a 6-second timeout
  const locationPromise = (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: loc.coords.latitude, lon: loc.coords.longitude };
  })();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('GPS timeout after 15s')), 15000)
  );

  return Promise.race([locationPromise, timeoutPromise]);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get weather data for the farmer's current location.
 *
 * Returns cached result on subsequent calls.
 * Always resolves (never throws) — falls back to DEFAULT_CLIMATE on any error.
 *
 * @returns {Promise<{temperature, humidity, rainfall, locationName, state, isReal}>}
 */
export async function getWeatherData() {
  // Return cache if available
  if (_cachedWeather) {
    return _cachedWeather;
  }

  // Deduplicate simultaneous calls (e.g., two screens mounting at once)
  if (_fetchPromise) {
    return _fetchPromise;
  }

  _fetchPromise = (async () => {
    try {
      const { lat, lon } = await _getCoordinates();
      const weather = await _fetchFromBackend(lat, lon);
      _cachedWeather = weather;
      return weather;
    } catch (err) {
      // GPS denied, timeout, network error, backend down → silent fallback
      console.warn('[Kisan Mitra] Weather fetch failed, using defaults:', err.message);
      _cachedWeather = { ...DEFAULT_CLIMATE };
      return _cachedWeather;
    } finally {
      _fetchPromise = null;
    }
  })();

  return _fetchPromise;
}

/**
 * Clear the weather cache.
 * Call this if the farmer moves to a significantly different location.
 * Currently not used in UI but available for future use.
 */
export function clearWeatherCache() {
  _cachedWeather = null;
  _fetchPromise  = null;
}

/**
 * Get the DEFAULT_CLIMATE constants (useful for tests or fallback UI).
 */
export function getDefaultClimate() {
  return { ...DEFAULT_CLIMATE };
}
