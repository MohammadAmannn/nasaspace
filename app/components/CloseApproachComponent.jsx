// components/CloseApproachComponent.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CloseApproachComponent = () => {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCloseApproaches = async () => {
      try {
        const response = await axios.get(
          `https://api.nasa.gov/neo/rest/v1/feed?start_date=2024-10-01&end_date=2024-10-07&api_key=YOUR_API_KEY`
        );
        
        const nearEarthObjects = response.data.near_earth_objects;

        // Filter asteroids that are near Earth (e.g., closer than 0.05 AU)
        const closeAsteroids = Object.values(nearEarthObjects)
          .flat()
          .filter(asteroid => 
            asteroid.close_approach_data.some(approach => parseFloat(approach.miss_distance.astronomical) < 0.05)
          );

        setAsteroids(closeAsteroids);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching NEO data:', error);
        setLoading(false);
      }
    };

    fetchCloseApproaches();
  }, []);

  if (loading) {
    return <div>Loading Close Approaches...</div>;
  }

  return (
    <div className="p-4 bg-gray-900 text-white rounded-md">
      <h2 className="text-2xl font-bold mb-4">Asteroids Passing Near Earth</h2>
      {asteroids.length === 0 ? (
        <p>No asteroids passing near Earth in the given period.</p>
      ) : (
        <ul className="space-y-4">
          {asteroids.map((asteroid) => (
            <li key={asteroid.id} className="border border-gray-700 p-2 rounded">
              <h3 className="text-xl font-semibold">{asteroid.name}</h3>
              <p><strong>Distance from Earth:</strong> {asteroid.close_approach_data[0].miss_distance.astronomical} AU</p>
              <p><strong>Speed:</strong> {asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour} km/h</p>
              <p><strong>Diameter:</strong> {asteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(2)} meters</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CloseApproachComponent;
