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
    console.log(containers);
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

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });