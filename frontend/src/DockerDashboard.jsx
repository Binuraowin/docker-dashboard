import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DockerDashboard = () => {
  const [containers, setContainers] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock metrics data - In production, this would come from your Docker API
  useEffect(() => {
    const generateMetrics = () => ({
      timestamp: new Date().toLocaleTimeString(),
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 16,
      networkIO: Math.random() * 1000,
    });

    const interval = setInterval(() => {
      setMetrics(prev => [...prev.slice(-10), generateMetrics()]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3006/api/containers');
      const data = await response.json();
      setContainers(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch container data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    if (status.includes('Up')) return '#22c55e';
    if (status.includes('Exited')) return '#ef4444';
    return '#eab308';
  };

  const getContainerStats = () => {
    const running = containers.filter(c => c.State === 'running').length;
    const stopped = containers.filter(c => c.State === 'exited').length;
    const total = containers.length;
    return [
      { name: 'Running', value: running, color: '#22c55e' },
      { name: 'Stopped', value: stopped, color: '#ef4444' },
      { name: 'Other', value: total - running - stopped, color: '#eab308' }
    ];
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Docker Container Dashboard</h1>
        <button
          onClick={fetchContainers}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {/* Metrics Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* CPU Usage Chart */}
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginBottom: '16px' }}>CPU Usage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cpuUsage" stroke="#3b82f6" name="CPU %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Memory Usage Chart */}
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginBottom: '16px' }}>Memory Usage (GB)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="memoryUsage" stroke="#22c55e" name="Memory (GB)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Container Status Distribution */}
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginBottom: '16px' }}>Container Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={getContainerStats()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {getContainerStats().map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#b91c1c',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px' }}>Loading container data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {containers.map((container) => (
            <div
              key={container.Id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                {container.Names[0].replace('/', '')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563' }}>Image:</span>
                  <span style={{ fontFamily: 'monospace' }}>{container.Image}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563' }}>Status:</span>
                  <span style={{ color: getStatusColor(container.Status) }}>
                    {container.Status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563' }}>Ports:</span>
                  <span style={{ fontFamily: 'monospace' }}>
                    {container.Ports.map((port) => 
                      `${port.PublicPort}:${port.PrivatePort}`
                    ).join(', ') || 'None'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button style={{ padding: '8px', color: '#22c55e', cursor: 'pointer', border: 'none', background: 'none' }}>
                    Start
                  </button>
                  <button style={{ padding: '8px', color: '#eab308', cursor: 'pointer', border: 'none', background: 'none' }}>
                    Stop
                  </button>
                  <button style={{ padding: '8px', color: '#ef4444', cursor: 'pointer', border: 'none', background: 'none' }}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DockerDashboard;