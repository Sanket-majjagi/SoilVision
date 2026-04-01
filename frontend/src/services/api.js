import { BASE_URL, ENDPOINTS } from '../constants/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: 'Network or parsing error' };
    }
    throw new Error(errorData.detail || errorData.message || 'API Request Failed');
  }
  return response.json();
};

export const analyzeSoil = async (soilData, landAcres, climate = { temperature: 28.5, humidity: 72.0, rainfall: 1200.0 }) => {
  const payload = {
    input_method: 'manual',
    land_size_acres: landAcres,
    soil_data: soilData,
    climate: climate
  };

  const response = await fetch(`${BASE_URL}${ENDPOINTS.ANALYZE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const analyzeColorKit = async (readings, landAcres, climate = { temperature: 30.0, humidity: 65.0, rainfall: 800.0 }) => {
  const payload = {
    land_size_acres: landAcres,
    readings: readings,
    climate: climate
  };

  const response = await fetch(`${BASE_URL}${ENDPOINTS.COLOR_KIT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const checkCrop = async (cropName, soilData) => {
  const payload = {
    crop_name: cropName,
    soil_data: soilData
  };

  const response = await fetch(`${BASE_URL}${ENDPOINTS.CROP_CHECK}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};
