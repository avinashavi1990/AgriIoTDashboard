import axios from 'axios';

const API_BASE_URL = 'https://39blk5ooyh.execute-api.us-east-1.amazonaws.com/latest';
const GET_LATEST_PATH = '';
const CONTROL_PATH = '/shadow';

export const getLatestSensorData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}${GET_LATEST_PATH}`);
    return response.data;
  } catch (err) {
    console.error('[API] Error fetching latest sensor data:', err);
    return null;
  }
};

export const updateShadowState = async (desired) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}${CONTROL_PATH}`,
      { state: { desired } },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (err) {
    console.error('[API] Error updating shadow state:', err.message);
    throw err;
  }
};
