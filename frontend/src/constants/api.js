export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
export const ENDPOINTS = {
  ANALYZE: '/api/v1/soil/analyze',
  COLOR_KIT: '/api/v1/soil/color-kit',
  CROP_CHECK: '/api/v1/crops/check',
  VISION: '/api/v1/vision/analyze',
  WEATHER: '/api/v1/weather',
  MARKET_PRICES: '/api/v1/market/prices',
};
