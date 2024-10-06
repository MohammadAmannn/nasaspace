"use client";
import { useEffect, useState } from 'react';
import Orrery from './three'; // Orrery 3D component
import { getNEOData } from './utility/main'; // Service fetching NEO data

export default function HomePage() {
  const [neoData, setNEOData] = useState([]);
  const [showPHAs, setShowPHAs] = useState(false);
  const [showTrajectories, setShowTrajectories] = useState(false);
  const [showCloseApproaches, setShowCloseApproaches] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getNEOData();
        const flattenedData = Object.values(data).flat();
        setNEOData(flattenedData);
      } catch (error) {
        console.error('Error fetching NEO data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-center mb-8 tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
        Dynamic Orrery with PHAs and Orbital Trajectories
      </h1>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
        <button 
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-pink-600 hover:to-indigo-600 rounded-full transition-all shadow-lg"
          onClick={() => setShowPHAs(!showPHAs)}
        >
          {showPHAs ? 'Hide' : 'Show'} Potentially Hazardous Asteroids
        </button>

        <button 
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 hover:from-green-500 hover:to-teal-500 rounded-full transition-all shadow-lg"
          onClick={() => setShowTrajectories(!showTrajectories)}
        >
          {showTrajectories ? 'Hide' : 'Show'} Orbital Trajectories
        </button>

        <button 
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-orange-500 hover:to-red-500 rounded-full transition-all shadow-lg"
          onClick={() => setShowCloseApproaches(!showCloseApproaches)}
        >
          View Close Approaches
        </button>
      
      </div>

      <div className="w-full max-w-6xl border border-gray-700 rounded-lg shadow-2xl overflow-hidden mb-8">
        <Orrery neoData={neoData} showPHAs={showPHAs} showTrajectories={showTrajectories} />
      </div>

      {showCloseApproaches && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-6xl">
          <h2 className="text-2xl font-bold mb-4">Close Approach Data</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {neoData.map((neo) => (
              <div key={neo.id} className="bg-gray-700 p-4 rounded-lg shadow hover:bg-gray-600 transition-all">
                <strong className="text-lg">{neo.name}</strong>
                <p>Diameter: {neo.estimated_diameter.kilometers.estimated_diameter_min} - {neo.estimated_diameter.kilometers.estimated_diameter_max} km</p>
                <p>Potentially Hazardous: {neo.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</p>
                {neo.close_approach_data && neo.close_approach_data.length > 0 && (
                  <>
                    <p>Close Approach Date: {neo.close_approach_data[0].close_approach_date_full}</p>
                    <p>Miss Distance: {neo.close_approach_data[0].miss_distance.kilometers} km</p>
                    <p>Relative Velocity: {neo.close_approach_data[0].relative_velocity.kilometers_per_hour} km/h</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
