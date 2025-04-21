// src/App.js
import React, { useEffect, useState } from 'react';
import { getLatestSensorData, updateShadow } from './api';
import TelemetryChart from './components/TelemetryChart';
import { getChartData } from './api';

function App() {
  const [success, setSuccess] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
  const [hasInitializedControls, setHasInitializedControls] = useState(false);
  const [controls, setControls] = useState({
    auto_mode: false,
    tank_pump: false,
    irr_pump: false,
    soil_threshold: 40,
    poll_interval: 60,
    irrigation_schedule: {
      enabled: false,
      start_time: '06:30',
      duration_min: 15,
      repeat: 'daily',
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getLatestSensorData();
        if (!Array.isArray(result) || result.length === 0) {
          console.error('Invalid telemetry format received:', result);
          setError('No telemetry data available');
          return;
        }

        const latest = result[0];
        console.log('[Latest Telemetry]', latest);
        setTelemetry(latest);

        // ✅ Only setControls on first load
        if (!hasInitializedControls) {
          setControls({
            auto_mode: latest.auto_mode === "true",
            tank_pump: latest.tank_pump === "true",
            irr_pump: latest.irrigation_pump === "true",
            soil_threshold: Number(latest.soil_threshold ?? 0),
            poll_interval: Number(latest.poll_interval_s ?? 60),
            irrigation_schedule: {
              enabled: latest.irrigation_enabled === "true",
              start_time: latest.irrigation_start_time ?? '06:30',
              duration_min: Number(latest.irrigation_duration_min ?? 0),
              repeat: latest.irrigation_repeat ?? 'daily',
            },
          });
          setHasInitializedControls(true);
        }

        const history = await getChartData({ nodeId: 1 });
        setChartData(history);
      } catch (err) {
        console.error('Error fetching sensor data:', err);
        setError('Failed to fetch sensor data');
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [hasInitializedControls]);

  const handleToggle = (key) => {
    setControls((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleScheduleChange = (field, value) => {
    setControls((prev) => ({
      ...prev,
      irrigation_schedule: {
        ...prev.irrigation_schedule,
        [field]: value,
      },
    }));
  };

  const handleUpdate = async () => {
    try {
      const shadowState = {
        ...controls,
        irr_pump: controls.irr_pump,
        soil_threshold: Number(controls.soil_threshold),
        poll_interval: Number(controls.poll_interval),
        irrigation_schedule: {
          ...controls.irrigation_schedule,
          duration_min: Number(controls.irrigation_schedule.duration_min),
        },
      };

      await updateShadow(shadowState);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('[App] Shadow update failed:', err);
      alert('Failed to update shadow');
    }
  };

  if (error) return <div className="text-red-600 p-6">{error}</div>;
  if (!telemetry) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-parchment p-6 font-sans">
      <header className="bg-forest text-white px-6 py-6 rounded-b-xl mb-8 shadow-md">
        <h1 className="text-4xl font-bold text-white text-center">Agri IoT Dashboard</h1>
        <p className="text-sm text-center mt-2">
          Latest packet received at: <span className="font-medium">{new Date(telemetry.time).toLocaleString()}</span>
        </p>
      </header>

      <section className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Telemetry Charts</h2>
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="button"
          >
            {showCharts ? "Hide Charts" : "Show Charts"}
          </button>
        </div>
        {showCharts && (
          <TelemetryChart data={chartData} />
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Snapshot */}
        <section className="card">
          <h2 className="section-title">Gateway Snapshot</h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-[#333]">
            <div>🆔 Node ID (Current): {telemetry.node_id}</div>
            <div>🌡️ Temperature: {telemetry.temperature_c} °C</div>
            <div>💧 Humidity: {telemetry.humidity_pct} %</div>
            <div>🔆 Lux: {telemetry.lux}</div>
            <div>🌱 Soil Moisture: {telemetry.soil_moisture_pct} %</div>
            <div>🚰 Tank Pump: <strong>{telemetry.tank_pump === "true" ? 'ON' : 'OFF'}</strong></div>
            <div>🌾 Irrigation Pump: <strong>{telemetry.irrigation_pump === "true" ? 'ON' : 'OFF'}</strong></div>
            <div>🤖 Auto Mode: {telemetry.auto_mode === "true" ? 'Enabled' : 'Disabled'}</div>
            <div>🧪 Threshold: {telemetry.soil_threshold} %</div>
            <div>🛢️ Tank Status: {telemetry.tank_status}</div>
            <div>⏱️ Poll Interval: {telemetry.poll_interval_s} s</div>
            <div>🧬 Firmware: {telemetry.firmware_version}</div>
            <div>📍 Lat/Lon: {telemetry.lat}, {telemetry.lon}</div>
            <div>
              🗓️ Schedule: {telemetry.irrigation_enabled === "true" ? 'On' : 'Off'} @ {telemetry.irrigation_start_time}
            </div>
          </div>
        </section>

        {/* Control Panel */}
        <section className="card">
          <h2 className="section-title">Control Panel</h2>
          <div className="space-y-6">
            <div>
              <h3 className="label">System Modes</h3>
              <div className="flex flex-wrap gap-4">
                {["auto_mode", "tank_pump", "irr_pump"].map((key) => (
                  <label key={key} className="flex items-center gap-2">
                    <input type="checkbox" checked={controls[key]} onChange={() => handleToggle(key)} />
                    <span className="capitalize">{key.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="label">Soil Moisture Threshold (%)</span>
                <input type="number" className="input" value={controls.soil_threshold}
                  onChange={(e) => setControls({ ...controls, soil_threshold: parseFloat(e.target.value) || 0 })} />
              </label>
              <label className="flex flex-col">
                <span className="label">Poll Interval (seconds)</span>
                <input type="number" className="input" value={controls.poll_interval}
                  onChange={(e) => setControls({ ...controls, poll_interval: parseInt(e.target.value) || 60 })} />
              </label>
            </div>

            <div>
              <h3 className="label">Irrigation Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={controls.irrigation_schedule.enabled}
                    onChange={() => handleScheduleChange('enabled', !controls.irrigation_schedule.enabled)} />
                  <span>Enable Schedule</span>
                </label>
                <label className="flex flex-col">
                  <span className="label">Start Time</span>
                  <input type="time" className="input" value={controls.irrigation_schedule.start_time}
                    onChange={(e) => handleScheduleChange('start_time', e.target.value)} />
                </label>
                <label className="flex flex-col">
                  <span className="label">Duration (min)</span>
                  <input type="number" className="input" value={controls.irrigation_schedule.duration_min}
                    onChange={(e) => handleScheduleChange('duration_min', parseFloat(e.target.value) || 0)} />
                </label>
                <label className="flex flex-col">
                  <span className="label">Repeat</span>
                  <select className="input" value={controls.irrigation_schedule.repeat}
                    onChange={(e) => handleScheduleChange('repeat', e.target.value)}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="none">None</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="text-right">
              <button onClick={handleUpdate} className="button">Update</button>
            </div>

            {success && (
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md mt-4 text-center">
                ✅ Settings sent to gateway
              </div>
            )}

            <details className="mt-8 text-sm text-gray-500">
              <summary className="cursor-pointer underline">Debug: Telemetry JSON</summary>
              <pre className="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
                {JSON.stringify(telemetry, null, 2)}
              </pre>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
