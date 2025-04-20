// src/api.js
import axios from 'axios';

const API_BASE = 'https://39blk5ooyh.execute-api.us-east-1.amazonaws.com';
const GET_LATEST_PATH = '/latest'; // GET /latest
const CONTROL_PATH = '/shadow';    // PUT /shadow

export async function getLatestSensorData() {
  try {
    const res = await axios.get(API_BASE + GET_LATEST_PATH);
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[API] Error fetching latest sensor data:', err);
    throw err;
  }
}

export async function updateShadow(desiredState) {
  try {
    // ⚠️ Do NOT wrap desiredState again under state → state → desired
    const payload = {
      state: {
        desired: desiredState
      }
    };
    const res = await axios.put(API_BASE + CONTROL_PATH, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    return res.data;
  } catch (err) {
    console.error('[API] Error updating shadow:', err);
    throw err;
  }
}

export async function getChartData({ nodeId = 1, minutes = 60 }) {
  const res = await axios.get(`${API_BASE}/latest?node_id=${nodeId}&minutes=${minutes}`);
  const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

  // Convert timestamp to JS Date format
  return data.map(d => ({
    ...d,
    time: new Date(d.time).getTime()
  }));
}