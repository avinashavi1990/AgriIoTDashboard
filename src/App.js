import React, { useEffect, useState } from 'react';
import { getLatestSensorData, updateShadowState } from './api';

const REFRESH_INTERVAL = 10000; // 10 seconds

function App() {
  const [data, setData] = useState({});
  const [autoMode, setAutoMode] = useState(true);
  const [pumpTank, setPumpTank] = useState(false);
  const [pumpIrrg, setPumpIrrg] = useState(false);
  const [soilThresh, setSoilThresh] = useState(30);
  const [pollInterval, setPollInterval] = useState(60);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[Dashboard] Fetching latest telemetry data...');
        const value = await getLatestSensorData();
        if (!value) return;

        setData(value);
        setAutoMode(value.auto_mode === true || value.auto_mode === 'true');
        setPumpTank(value.tank_pump === true || value.tank_pump === 'true');
        setPumpIrrg(value.irrigation_pump === true || value.irrigation_pump === 'true');
        setSoilThresh(Number(value.soil_threshold));
        setPollInterval(Number(value.poll_interval));
      } catch (error) {
        console.error('[Dashboard] Failed to fetch data:', error);
      }
    };

    fetchData(); // Initial load
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 text-white bg-[#0d47a1] min-h-screen">
      <h1 className="text-3xl font-bold mb-6">IoT Agri Dashboard</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Live Sensor Readings */}
        <div className="bg-white text-black p-4 rounded-xl shadow-md">
          <h2 className="font-semibold text-lg mb-2">Live Sensor Readings</h2>
          <ul>
            <li>Temperature: {data.temperature}°C</li>
            <li>Humidity: {data.humidity}%</li>
            <li>Lux: {data.lux}</li>
            <li>Soil Moisture: {data.soil_moisture}</li>
            <li>Tank Status: {data.tank_status}</li>
            <li>Soil Threshold: {soilThresh}</li>
            <li>Poll Interval: {pollInterval}s</li>
          </ul>
        </div>

        {/* Controls */}
        <div className="bg-white text-black p-4 rounded-xl shadow-md">
          <h2 className="font-semibold text-lg mb-2">Controls</h2>
          <div className="flex flex-col gap-3">
            <label>
              <input
                type="checkbox"
                checked={autoMode}
                onChange={async (e) => {
                  const newVal = e.target.checked;
                  setAutoMode(newVal);
                  await updateShadowState({ autoMode: newVal });
                }}
              /> Auto Mode
            </label>

            <label>
              <input
                type="checkbox"
                checked={pumpTank}
                onChange={async (e) => {
                  const newVal = e.target.checked;
                  setPumpTank(newVal);
                  await updateShadowState({ tankPump: newVal });
                }}
              /> Pump Tank
            </label>

            <label>
              <input
                type="checkbox"
                checked={pumpIrrg}
                onChange={async (e) => {
                  const newVal = e.target.checked;
                  setPumpIrrg(newVal);
                  await updateShadowState({ irrPump: newVal });
                }}
              /> Pump Irrigation
            </label>

            <label>
              Soil Threshold:
              <input
                type="number"
                className="ml-2 p-1 border rounded"
                value={soilThresh}
                onChange={(e) => setSoilThresh(Number(e.target.value))}
                onBlur={async () => {
                  await updateShadowState({ soilThresh });
                }}
              />
            </label>

            <label>
              Poll Interval (sec):
              <input
                type="number"
                className="ml-2 p-1 border rounded"
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                onBlur={async () => {
                  await updateShadowState({ pollInterval });
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
