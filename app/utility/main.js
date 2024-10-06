import axios from 'axios';

const NASA_API_KEY = 'W9QarJMSyrYgH8QB2SwMAcMLNbwK5M9h2pgIHVUh';
const BASE_URL = `https://api.nasa.gov/neo/rest/v1/`;

export const getNEOData = async () => {
  const response = await axios.get(`${BASE_URL}feed?start_date=2023-09-01&end_date=2023-09-08&api_key=${NASA_API_KEY}`);
  
  // Log the full response to understand its structure
  console.log('API Response:', response.data);

  return response.data.near_earth_objects; // Return the NEOs directly
};
