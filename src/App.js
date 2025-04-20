// src/App.js
import React, { useEffect, useState } from 'react';
import { getLatestSensorData, updateShadow } from './api';
import TelemetryChart from './components/TelemetryChart';
import { getChartData } from './api'; // ensure this is added to api.js


function App() {
  const [telemetry, setTelemetry] = useState(null);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
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
        setTelemetry(latest);

        setControls({
          auto_mode: !!latest.auto_mode,
          tank_pump: !!latest.tank_pump,
          irr_pump: !!latest.irrigation_pump,
          soil_threshold: Number(latest.soil_threshold) || 0,
          poll_interval: Number(latest.poll_interval_s) || 60,
          irrigation_schedule: {
            enabled: !!latest.irrigation_enabled,
            start_time: latest.irrigation_start_time || '06:30',
            duration_min: Number(latest.irrigation_duration_min) || 0,
            repeat: latest.irrigation_repeat || 'daily',
          },
        });
        const history = await getChartData({ nodeId: 1 });
        setChartData(history);
      } catch (err) {
        console.error('Error fetching sensor data:', err);
        setError('Failed to fetch sensor data');
      }
    }

    fetchData();
  }, []);

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
      alert('Settings sent to gateway');
    } catch (err) {
      console.error('[App] Shadow update failed:', err);
      alert('Failed to update shadow');
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (!telemetry) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-green-700">Agri IoT Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Latest packet received at: <span className="font-medium">{new Date(telemetry.time).toLocaleString()}</span>
        </p>
      </header>
    
      {/* === Telemetry Charts === */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Telemetry Charts</h2>
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="text-sm text-white bg-blue-500 hover:bg-blue-600 px-4 py-1 rounded"
          >
            {showCharts ? "Hide Charts" : "Show Charts"}
          </button>
        </div>

        {showCharts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TelemetryChart data={chartData} dataKey="temperature_c" color="#ef4444" label="Temperature (°C)" />
            <TelemetryChart data={chartData} dataKey="humidity_pct" color="#3b82f6" label="Humidity (%)" />
            <TelemetryChart data={chartData} dataKey="soil_moisture_pct" color="#10b981" label="Soil Moisture (%)" />
            <TelemetryChart data={chartData} dataKey="lux" color="#f59e0b" label="Light (lux)" />
          </div>
        )}
      </section>

    
      {/* === Main Grid for Snapshot and Controls === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* === Gateway Snapshot === */}
        <section className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Gateway Snapshot</h2>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
            <div>🌡️ Temp: {telemetry.temperature_c} °C</div>
            <div>💧 Humidity: {telemetry.humidity_pct} %</div>
            <div>🔆 Lux: {telemetry.lux}</div>
            <div>🌱 Soil Moisture: {telemetry.soil_moisture_pct} %</div>
            <div>🚰 Tank Pump: <strong>{telemetry.tank_pump ? 'ON' : 'OFF'}</strong></div>
            <div>🌾 Irrigation Pump: <strong>{telemetry.irrigation_pump ? 'ON' : 'OFF'}</strong></div>
            <div>🤖 Auto Mode: {telemetry.auto_mode ? 'Enabled' : 'Disabled'}</div>
            <div>🧪 Threshold: {telemetry.soil_threshold} %</div>
            <div>🛢️ Tank Status: {telemetry.tank_status}</div>
            <div>⏱️ Poll Interval: {telemetry.poll_interval_s} s</div>
            <div>🧬 Firmware: {telemetry.firmware_version}</div>
            <div>📍 Lat/Lon: {telemetry.lat}, {telemetry.lon}</div>
            <div>
              🗓️ Schedule: {telemetry.irrigation_enabled ? 'On' : 'Off'} @ {telemetry.irrigation_start_time}
            </div>
          </div>
        </section>
    
        {/* === Control Panel === */}
        <section className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Control Panel</h2>
          <div className="space-y-6">
    
            {/* === Modes & Pumps === */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">System Modes</h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={controls.auto_mode} onChange={() => handleToggle('auto_mode')} />
                  <span>Auto Mode</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={controls.tank_pump} onChange={() => handleToggle('tank_pump')} />
                  <span>Tank Pump</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={controls.irr_pump} onChange={() => handleToggle('irr_pump')} />
                  <span>Irrigation Pump</span>
                </label>
              </div>
            </div>
    
            {/* === Thresholds & Polling === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="text-sm text-gray-600 mb-1">Soil Moisture Threshold (%)</span>
                <input
                  type="number"
                  className="border rounded px-3 py-1"
                  value={controls.soil_threshold ?? 0}
                  onChange={(e) =>
                    setControls({
                      ...controls,
                      soil_threshold: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="flex flex-col">
                <span className="text-sm text-gray-600 mb-1">Poll Interval (seconds)</span>
                <input
                  type="number"
                  className="border rounded px-3 py-1"
                  value={controls.poll_interval ?? 60}
                  onChange={(e) =>
                    setControls({
                      ...controls,
                      poll_interval: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </label>
            </div>
    
            {/* === Irrigation Schedule === */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Irrigation Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={controls.irrigation_schedule.enabled}
                    onChange={() =>
                      handleScheduleChange('enabled', !controls.irrigation_schedule.enabled)
                    }
                  />
                  <span>Enable Schedule</span>
                </label>
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-1">Start Time</span>
                  <input
                    type="time"
                    className="border rounded px-3 py-1"
                    value={controls.irrigation_schedule.start_time}
                    onChange={(e) => handleScheduleChange('start_time', e.target.value)}
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-1">Duration (min)</span>
                  <input
                    type="number"
                    className="border rounded px-3 py-1"
                    value={controls.irrigation_schedule.duration_min ?? 0}
                    onChange={(e) =>
                      handleScheduleChange(
                        'duration_min',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-1">Repeat</span>
                  <select
                    className="border rounded px-3 py-1"
                    value={controls.irrigation_schedule.repeat}
                    onChange={(e) => handleScheduleChange('repeat', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="none">None</option>
                  </select>
                </label>
              </div>
            </div>
    
            {/* === Action Button === */}
            <div className="text-right">
              <button
                onClick={handleUpdate}
                className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700"
              >
                Update
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
