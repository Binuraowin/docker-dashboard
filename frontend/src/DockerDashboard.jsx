import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Moon, Sun } from 'lucide-react';

const DockerDashboard = () => {
  const [containers, setContainers] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDark, setIsDark] = useState(false);

  // Theme configuration
  const theme = {
    background: isDark ? '#1a1b1e' : '#f3f4f6',
    cardBg: isDark ? '#2c2d31' : 'white',
    text: isDark ? '#e5e7eb' : '#1f2937',
    secondaryText: isDark ? '#9ca3af' : '#4b5563',
    border: isDark ? '#374151' : '#e5e7eb',
    chartGrid: isDark ? '#374151' : '#e5e7eb',
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/metrics');
      const data = await response.json();
      setMetrics(prev => {
        const newMetrics = [...prev];
        data.forEach(metric => {
          const containerMetrics = newMetrics.filter(m => m.containerId === metric.containerId);
          if (containerMetrics.length >= 10) {
            const oldestIndex = newMetrics.findIndex(m => m.containerId === metric.containerId);
            newMetrics.splice(oldestIndex, 1);
          }
          newMetrics.push(metric);
        });
        return newMetrics;
      });
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

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
    fetchMetrics();
    
    const metricsInterval = setInterval(fetchMetrics, 2000);
    const containersInterval = setInterval(fetchContainers, 5000);
    
    return () => {
      clearInterval(metricsInterval);
      clearInterval(containersInterval);
    };
  }, []);

  const handleContainerAction = async (containerId, action) => {
    try {
      const response = await fetch(`http://localhost:3006/api/containers/${containerId}/${action}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`Failed to ${action} container`);
      fetchContainers();
    } catch (err) {
      setError(`Failed to ${action} container: ${err.message}`);
    }
  };

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

  const getContainerMetrics = (containerId) => {
    return metrics.filter(m => m.containerId === containerId);
  };

  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: theme.background,
      color: theme.text,
      minHeight: '100vh',
      transition: 'background-color 0.3s, color 0.3s',
    },
    card: {
      backgroundColor: theme.cardBg,
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.3s, border-color 0.3s',
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    actionButton: (color) => ({
      padding: '8px 16px',
      color: color,
      cursor: 'pointer',
      border: `1px solid ${color}`,
      borderRadius: '4px',
      backgroundColor: 'transparent',
      transition: 'all 0.3s',
      '&:hover': {
        backgroundColor: `${color}10`,
      },
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    }),
  };

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Docker Container Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              ...styles.button,
              backgroundColor: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={fetchContainers} style={styles.button}>
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Section */}
      <div style={{ ...styles.card, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>System Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Pie Chart */}
          <div>
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
                <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {['Running', 'Stopped', 'Total'].map((stat) => (
              <div
                key={stat}
                style={{
                  ...styles.card,
                  backgroundColor: isDark ? '#374151' : '#f8fafc',
                  textAlign: 'center',
                }}
              >
                <h3 style={{ fontSize: '14px', color: theme.secondaryText }}>{stat} Containers</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stat === 'Running' && containers.filter(c => c.State === 'running').length}
                  {stat === 'Stopped' && containers.filter(c => c.State === 'exited').length}
                  {stat === 'Total' && containers.length}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {containers.filter(c => c.State === 'running').map(container => (
          <div key={container.Id} style={styles.card}>
            <h3 style={{ marginBottom: '16px' }}>{container.Names[0].replace('/', '')} - Metrics</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={getContainerMetrics(container.Id)}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                <XAxis dataKey="timestamp" stroke={theme.text} />
                <YAxis stroke={theme.text} />
                <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }} />
                <Line type="monotone" dataKey="cpuUsage" stroke="#3b82f6" name="CPU %" />
                <Line type="monotone" dataKey="memoryUsage" stroke="#22c55e" name="Memory (GB)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
          border: `1px solid ${isDark ? '#991b1b' : '#ef4444'}`,
          color: isDark ? '#fecaca' : '#b91c1c',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* Containers List */}
      {loading ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '32px' }}>
          Loading container data...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {containers.map((container) => (
            <div key={container.Id} style={styles.card}>
              <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                {container.Names[0].replace('/', '')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: theme.secondaryText }}>Image:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{container.Image}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: theme.secondaryText }}>Status:</span>
                  <span style={{ color: getStatusColor(container.Status) }}>
                    {container.Status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: theme.secondaryText }}>Ports:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                    {container.Ports.map((port) => 
                      `${port.PublicPort}:${port.PrivatePort}`
                    ).join(', ') || 'None'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button 
                    onClick={() => handleContainerAction(container.Id, 'start')}
                    style={styles.actionButton('#22c55e')}
                    disabled={container.State === 'running'}
                  >
                    Start
                  </button>
                  <button 
                    onClick={() => handleContainerAction(container.Id, 'stop')}
                    style={styles.actionButton('#eab308')}
                    disabled={container.State !== 'running'}
                  >
                    Stop
                  </button>
                  <button 
                    onClick={() => handleContainerAction(container.Id, 'remove')}
                    style={styles.actionButton('#ef4444')}
                    disabled={container.State === 'running'}
                  >
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