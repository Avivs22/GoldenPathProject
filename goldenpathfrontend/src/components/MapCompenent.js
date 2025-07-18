import React, { useEffect, useState,useCallback  } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import planeImg from "../images/plane.png";
import droneImg from "../images/drone.png";
import myAxios from './axiosInterface.js';
import axios from "axios"
import "./ButtonStyles.css"



const createGlowingRotatedIcon = (heading) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        transform: rotate(${heading}deg);
        width: 24px;
        height: 24px;
        background: url(${planeImg}) no-repeat center;
        background-size: cover;
        box-shadow: 0 0 30px 15px rgba(61, 252, 3, 0.8);
        border-radius: 50%;
      "></div>`,
    iconSize: [24, 24],
    iconAnchor: [16, 16],
  });
};

// Function to create a rotated icon based on the heading
const createRotatedIcon = (heading) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="transform: rotate(${heading}deg); width: 24px; height: 24px; background: url(${planeImg}) no-repeat center; background-size: cover;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [16, 16], // Anchor in the center of the icon
  });
};

// Function to create an information icon for displaying plane details
const createInfoIcon = (callsign, timeToCollision, timeToCollisionNoVector) => {
  return L.divIcon({
    className: 'info-div-icon',
    html: `<div style="background-color: white; padding: 5px; border-radius: 5px; box-shadow: 0 0 5px rgba(0,0,0,0.5); transform: translateY(-30px);">
            <div style="font-size: 12px; color: black; text-align: center;">
              ${callsign}<br/>Time to Collision: ${(timeToCollision / 60).toFixed(2)}min
            </div>
          </div>`,
    iconSize: [120, 60],
    iconAnchor: [60, 30],
  });
};
const createInfoIcon2 = (callsign) => {
  return L.divIcon({
    className: 'info-div-icon',
    html: `<div style="background-color: white; padding: 5px; border-radius: 5px; box-shadow: 0 0 5px rgba(0,0,0,0.5); transform: translateY(-30px);">
            <div style="font-size: 12px; color: black; text-align: center;">
              ${callsign}
            </div>
          </div>`,
    iconSize: [120, 60],
    iconAnchor: [60, 30],
  });
};

const MapComponent = () => {  
  const fetchClosestPlane = async (planeData, marker) => {
    try {
      const response = await myAxios.post('/api/findClosestPlane', {
        planeData:planeData,
        droneMarker: marker // Updated parameter name
      });
      return response.data.plane;
    } catch (error) {
      console.error('Error fetching closest plane:', error);
      return null;
    }
  };
  

  
  const [planeData, setPlaneData] = useState([]);
  const [filterPlaneData, setFilterPlaneData] = useState([]);
  const [hoveredPlane, setHoveredPlane] = useState(null);
  const [userMarkers, setUserMarkers] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

   const updateFilteredPlaneData = useCallback(async () => {
  const promises = userMarkers.map(marker => fetchClosestPlane(planeData, marker));
  const results = await Promise.all(promises);
  const validPlanes = results.filter(plane => plane !== null);
  setFilterPlaneData(validPlanes);
}, [userMarkers, planeData]);

   const fetchPlaneData = async () => {
      try {
        const response = await axios.get('https://opensky-network.org/api/states/all', {
          auth: {
            username: 'avivs22',
            password: '123698745t',
          },
        });
        const limitNum = 100;
        const limitedPlanes = response.data.states.slice(0, limitNum).map(state => ({
          longitude: state[5],
          latitude: state[6],
          velocity: state[9],
          heading: state[10], // Use heading directly for rotation
          callsign: state[1], // Add callsign to the plane data
        }))
        .filter(plane =>
        typeof plane.latitude === 'number' &&
         typeof plane.longitude === 'number' &&
         !isNaN(plane.latitude) &&
        !isNaN(plane.longitude) &&
        plane.callsign !== ""
  );;
        setPlaneData(limitedPlanes);
      } catch (error) {
        console.error('Error fetching plane data:', error);
      }
    };
  useEffect(() => {
    if (userMarkers.length > 0) {
      updateFilteredPlaneData();
    } 
  }, [userMarkers, planeData,updateFilteredPlaneData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const latitude = parseFloat(e.target.latitude.value);
    const longitude = parseFloat(e.target.longitude.value);
    const radius = parseFloat(e.target.radius.value); // Get the radius from the form
    const speed = parseFloat(e.target.speed.value); // Get the speed from the form
    if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(radius) && !isNaN(speed)) {
      setUserMarkers(prevMarkers => [...prevMarkers, { position: [latitude, longitude], radius, speed }]);
    }
  };

  const handleSave = async () => {
    try {
      // Send plane data
      const savePlaneData = filterPlaneData.map(plane => ({
        planesID: plane.callsign, // Use plane.callsign as a unique identifier
        planelongitude: plane.longitude,
        planelatitude: plane.latitude,
        planevelocity: plane.velocity,
        planeheading: plane.heading,
      }));
      
      await Promise.all(savePlaneData.map(data =>
        myAxios.post('/planes', data)
      ));
      
      // Send drone data
      await Promise.all(userMarkers.map(marker =>
        myAxios.post('/drones', {
          dronelatitude: marker.position[0],
          dronelongitude: marker.position[1],
          droneradius: marker.radius,
          dronespeed: marker.speed
        })
      ));
      
      alert('Data saved successfully!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data.');
    }
  };

  const handleLoad = async () => {
    try {
      // Fetch plane data from backend
      const planesResponse = await myAxios.get('/planes');
      const fetchedPlanes = planesResponse.data.map(plane => ({
        longitude: plane.planelongitude,
        latitude: plane.planelatitude,
        velocity: plane.planevelocity,
        heading: plane.planeheading,
        callsign: plane.planesID,
      }));

      // Fetch drone data from backend
      const dronesResponse = await myAxios.get('/drones');
      const fetchedDrones = dronesResponse.data.map(drone => ({
        position: [drone.dronelatitude, drone.dronelongitude],
        radius: drone.droneradius,
        speed: drone.dronespeed,
      }));

      // Update state with the loaded data
      setPlaneData(prev => [...prev, ...fetchedPlanes]);
      setFilterPlaneData(prev => [...prev, ...fetchedPlanes]);
      setUserMarkers(prev => [...prev, ...fetchedDrones]);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data.');
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer center={[51.505, -0.09]} zoom={2} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filterPlaneData.map((plane, index) => (
          <React.Fragment key={index}>
            {/* Draw path if initial position exists */}
            {plane.initialPosition && (
              <Polyline
                positions={[
                  plane.initialPosition,
                  [plane.latitude, plane.longitude]
                ]}
                color="white"
                weight={2}
                opacity={0.7}
              />
            )}
            <Marker
              position={[plane.latitude, plane.longitude]}
              icon={createGlowingRotatedIcon(plane.heading)}
              eventHandlers={{
                mouseover: () => setHoveredPlane(plane),
                mouseout: () => setHoveredPlane(null),
              }}
            />
            {hoveredPlane && hoveredPlane === plane && (
              <Marker
                position={[plane.latitude + 0.1, plane.longitude + 0.1]} // Adjust the position as needed
                icon={createInfoIcon(plane.callsign, plane.minTimeToCollision,plane.timeToCollisionNoVector)}
              />
            )}
          </React.Fragment>
        ))}
         {planeData.map((plane, index) => (
          <React.Fragment key={index}>
            {/* Draw path if initial position exists */}
            {plane.initialPosition && (
              <Polyline
                positions={[
                  plane.initialPosition,
                  [plane.latitude, plane.longitude]
                ]}
                color="white"
                weight={2}
                opacity={0.7}
              />
            )}
            <Marker
              position={[plane.latitude, plane.longitude]}
              icon={createRotatedIcon(plane.heading)}
              eventHandlers={{
                mouseover: () => setHoveredPlane(plane),
                mouseout: () => setHoveredPlane(null),
              }}
            />
            {hoveredPlane && hoveredPlane === plane && (
              <Marker
                position={[plane.latitude + 0.1, plane.longitude + 0.1]} // Adjust the position as needed
                icon={createInfoIcon2(plane.callsign)}
              />
            )}
          </React.Fragment>
        ))}
        {userMarkers.map((marker, index) => (
          <React.Fragment key={index}>
            <Marker
              position={marker.position}
              icon={L.icon({
                iconUrl: droneImg, // Updated icon
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              })}
            />
            <Circle
              center={marker.position}
              radius={marker.radius}
              color="red"
              fillColor="rgba(255, 0, 0, 0.3)"
            />
          </React.Fragment>
        ))}
      </MapContainer>
      <button
        onClick={handleSave}
        disabled
        style={{
          position: 'absolute',
          top: '10px',
          left: '50px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1000, // Ensure it appears on top of the map
        }}
      >
        Save
      </button>
      <button
        onClick={handleLoad}
        disabled
        style={{
          position: 'absolute',
          top: '50px',
          left: '50px',
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1000, // Ensure it appears on top of the map
        }}
      >
        Load
      </button>
      <button
        onClick={fetchPlaneData}
        className="floating-button"
      >
        Update Planes
      </button>
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: isMinimized ? '30px' : '300px',
        height: isMinimized ? '40px' : '40vh',
        padding: isMinimized ? '5px' : '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        zIndex: 1000, // Ensure it appears on top of the map
        transition: 'all 0.3s ease'
      }}>
        <button
          onClick={() => setIsMinimized(prev => !prev)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
          }}
        >
          {isMinimized ? '+' : '-'}
        </button>
        {!isMinimized && (
          <>
           <h2 style={{ fontSize: '18px', margin: '0 0 10px', color: '#333' ,fontFamily: 'Merriweather, Georgia, serif', textAlign:"center"}}>Enter Position</h2>
           <form onSubmit={handleSubmit}>
             <label style={{ display: 'block', marginBottom: '10px' }}>
               Latitude:
               <input type="number" step="0.0001" name="latitude" required
                      style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd' }} />
             </label>
             <label style={{ display: 'block', marginBottom: '10px' }}>
               Longitude:
               <input type="number" step="0.0001" name="longitude" required
                      style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd' }} />
             </label>
             <label style={{ display: 'block', marginBottom: '10px' }}>
               Radius (meters):
               <input type="number" name="radius" required
                      style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd' }} />
             </label>
             <label style={{ display: 'block', marginBottom: '10px' }}>
               Speed (m/s):
               <input type="number" name="speed" required
                      style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd' }} />
             </label>
             <button type="submit"
                     className="add-marker-button">
               Add Marker
             </button>
           </form>
           </>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
