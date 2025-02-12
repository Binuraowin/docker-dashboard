const express = require('express');
const Docker = require('dockerode');
const cors = require('cors');

const app = express();
const docker = new Docker();
const PORT = process.env.PORT || 3006;


app.use(cors());

app.get('/api/containers', async (req, res) => {
  try {
    console.log('Running')
    const containers = await docker.listContainers({ all: true });
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
    try {
      const containers = await docker.listContainers();
      const stats = await Promise.all(
        containers.map(async (container) => {
          const containerObj = docker.getContainer(container.Id);
          const stats = await containerObj.stats({ stream: false });
          return stats;
        })
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/metrics', async (req, res) => {
    try {
      const containers = await docker.listContainers();
      const metrics = await Promise.all(
        containers.map(async (container) => {
          try {
            const containerObj = docker.getContainer(container.Id);
            const stats = await containerObj.stats({ stream: false });
            
            // Calculate CPU usage percentage
            const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
            const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
            const numberOfCPUs = stats.cpu_stats.online_cpus;
            const cpuPercent = (cpuDelta / systemCpuDelta) * numberOfCPUs * 100.0;
  
            // Calculate memory usage in GB
            const memoryUsage = stats.memory_stats.usage / (1024 * 1024 * 1024);
            const memoryLimit = stats.memory_stats.limit / (1024 * 1024 * 1024);
            const memoryPercent = (stats.memory_stats.usage / stats.memory_stats.limit) * 100;
  
            // Network stats in MB
            const networkIn = Object.values(stats.networks || {}).reduce(
              (sum, network) => sum + network.rx_bytes, 0
            ) / (1024 * 1024);
            const networkOut = Object.values(stats.networks || {}).reduce(
              (sum, network) => sum + network.tx_bytes, 0
            ) / (1024 * 1024);
  
            return {
              containerId: container.Id,
              name: container.Names[0].replace('/', ''),
              timestamp: new Date().toLocaleTimeString(),
              cpuUsage: Number(cpuPercent.toFixed(2)),
              memoryUsage: Number(memoryUsage.toFixed(2)),
              memoryLimit: Number(memoryLimit.toFixed(2)),
              memoryPercent: Number(memoryPercent.toFixed(2)),
              networkIn: Number(networkIn.toFixed(2)),
              networkOut: Number(networkOut.toFixed(2))
            };
          } catch (error) {
            console.error(`Error getting stats for container ${container.Id}:`, error);
            return null;
          }
        })
      );
  
      // Filter out any null values from failed container stats
      const validMetrics = metrics.filter(metric => metric !== null);
      res.json(validMetrics);
    } catch (error) {
      console.error('Error getting container metrics:', error);
      res.status(500).json({ error: error.message });
    }
  });
  

  // Add these routes to your server.js
app.post('/api/containers/:id/start', async (req, res) => {
    try {
      const container = docker.getContainer(req.params.id);
      await container.start();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/api/containers/:id/stop', async (req, res) => {
    try {
      const container = docker.getContainer(req.params.id);
      await container.stop();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/api/containers/:id/remove', async (req, res) => {
    try {
      const container = docker.getContainer(req.params.id);
      await container.remove();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });