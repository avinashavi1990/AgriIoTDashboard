import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const TelemetryChart = ({ data }) => {
  console.log('[ChartData Sample Timestamp]', data[0]?.time);

  return (
    <div className="card bg-white">
      <h2 className="section-title">Telemetry Overview</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis
            dataKey="time"
            tickFormatter={(tick) =>
              new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          />
          <YAxis />
          <Tooltip
            labelFormatter={(label) =>
              new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          />
          <Legend />
          <Line type="monotone" dataKey="temperature_c" stroke="#ef4444" name="Temperature (°C)" />
          <Line type="monotone" dataKey="humidity_pct" stroke="#3b82f6" name="Humidity (%)" />
          <Line type="monotone" dataKey="soil_moisture_pct" stroke="#10b981" name="Soil Moisture (%)" />
          <Line type="monotone" dataKey="lux" stroke="#f59e0b" name="Light (lux)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TelemetryChart;
