const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors());


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/planes', async (req, res) => {
  try {
    const planes = await prisma.PlanesDB.findMany();
    res.json(planes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve planes' });
  }
});

// Endpoint to get all drone data
app.get('/drones', async (req, res) => {
  try {
    const drones = await prisma.DroneDB.findMany();
    res.json(drones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve drones' });
  }
});

// Endpoint to add new plane data
app.post('/planes', async (req, res) => {
    const { planesID, planelongitude, planelatitude, planevelocity, planeheading } = req.body;
    console.log(req.body);
  
    try {
      const newPlane = await prisma.PlanesDB.upsert({
        where: { planesID: planesID },
        update: {
          planelongitude,
          planelatitude,
          planevelocity,
          planeheading
        },
        create: {
          planesID,
          planelongitude,
          planelatitude,
          planevelocity,
          planeheading
        }
      });
  
      res.status(201).json(newPlane);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to upsert plane' });
    }
  });
  


// Endpoint to add new drone data
app.post('/drones', async (req, res) => {
    const {dronelatitude, dronelongitude, droneradius, dronespeed } = req.body;
  
    try {
      // Check if a drone with the same ID already exists
  
      // If not, create a new drone record
      const newDrone = await prisma.DroneDB.create({
        data: {
          dronelatitude,
          dronelongitude,
          droneradius,
          dronespeed
        }
      });
  
      res.status(201).json(newDrone);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to create drone' });
    }
  });
  
  
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});