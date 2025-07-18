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
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
};
const headingToVector = (heading, speed) => {
  const headingRad = heading * (Math.PI / 180);
  return {
    x: speed * Math.cos(headingRad),
    y: speed * Math.sin(headingRad),
    z: 0 // Assuming 2D movement on the Earth's surface
  };
};

// Function to convert latitude and longitude to Cartesian coordinates in meters
const latLonToCartesian = (lat, lon) => {
  const R = 6371000; // Radius of Earth in meters
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180);

  return {
    x: R * Math.cos(latRad) * Math.cos(lonRad),
    y: R * Math.cos(latRad) * Math.sin(lonRad),
    z: R * Math.sin(latRad)
  };
};

// Function to calculate the direction vector from drone to plane
const calculateDirectionVector = (dronePosition, planePosition) => {
  return {
    x: planePosition.x - dronePosition.x,
    y: planePosition.y - dronePosition.y,
    z: planePosition.z - dronePosition.z
  };
};

// Function to normalize a vector
const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
    z: vector.z / magnitude
  };
};

// Function to calculate the drone's velocity vector
const calculateBombVelocityVector = (dronePosition, planePosition, droneSpeed) => {
  const directionVector = calculateDirectionVector(dronePosition, planePosition);
  const normalizedDirection = normalizeVector(directionVector);
  return {
    x: normalizedDirection.x * droneSpeed,
    y: normalizedDirection.y * droneSpeed,
    z: normalizedDirection.z * droneSpeed
  };
};

// Function to calculate dot product of two vectors
const dotProduct = (vec1, vec2) => {
  return vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z;
};

// Function to calculate the magnitude of a vector
const vectorMagnitude = (vec) => {
  return Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
};

// Function to calculate time to collision
const calculateCollisionTime = (planePosition, dronePosition, planeSpeed, planeHeading, droneSpeed) => {
  const planeCartesian = latLonToCartesian(planePosition[0], planePosition[1]);
  const droneCartesian = latLonToCartesian(dronePosition[0], dronePosition[1]);

  const planeVector = headingToVector(planeHeading, planeSpeed);
  const droneVector = calculateBombVelocityVector(droneCartesian, planeCartesian, droneSpeed);

  const relativeVelocity = {
    x: planeVector.x - droneVector.x,
    y: planeVector.y - droneVector.y,
    z: planeVector.z - droneVector.z
  };

  const relativePosition = calculateDirectionVector(droneCartesian, planeCartesian);


  const dotProd = dotProduct(relativePosition, relativeVelocity);
  const relativeVelocityMagnitude = vectorMagnitude(relativeVelocity);


  if (relativeVelocityMagnitude === 0) {
    return Infinity; // No collision if relative velocity is zero
  }

  const timeToCollision = dotProd / (relativeVelocityMagnitude ** 2);

  return timeToCollision > 0 ? timeToCollision : Infinity
};

const findClosestPlane = (planeData,droneMarker) => {
  let closestPlane = null;
  let minTimeToCollision = Infinity;
  planeData.forEach(plane => {
    const distance = getDistance(
      plane.latitude,
      plane.longitude,
      droneMarker.position[0],
      droneMarker.position[1]
    );
    if (distance <= droneMarker.radius) {
      const timeToCollision = calculateCollisionTime(
        [plane.latitude, plane.longitude],
        droneMarker.position,
        plane.velocity,
        droneMarker.speed,
        plane.heading
      );
      if (timeToCollision < minTimeToCollision) {
        minTimeToCollision = timeToCollision;
        let timeToCollisionNoVector = distance / droneMarker.speed
        closestPlane = { ...plane, minTimeToCollision, timeToCollisionNoVector };
      }
    }
  });
  return closestPlane;
};
// Endpoint to calculate time to collision
app.post('/api/calculateTimeToCollision', (req, res) => {
  const { planePosition, dronePosition, planeSpeed, droneSpeed, planeHeading } = req.body;
  const timeToCollision = calculateCollisionTime(planePosition, dronePosition, planeSpeed, droneSpeed, planeHeading);
  res.json({ timeToCollision });
});
app.post('/api/findClosestPlane', async (req, res) => {
  try {
    const { planeData, droneMarker } = req.body;
    const plane = findClosestPlane(planeData, droneMarker);
    res.json({ plane });
  } catch (error) {
    console.error('Error in /api/findClosestPlane:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}); 
  
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});