import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Orrery = ({ neoData = [], showPHAs, showTrajectories }) => {
  const mountRef = useRef(null);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [hoveredObjectData, setHoveredObjectData] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Softer light
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Sun (with slight glow effect)
    const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const sunMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xffc300 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Space background
    const spaceTexture = new THREE.TextureLoader().load('/path-to-space-background.jpg');
    scene.background = spaceTexture;

    // Planetary Orbits
    const orbits = [];
    const planetData = [{ name: 'Earth', distance: 5, color: 0x3b82f6 }];

    planetData.forEach((planet) => {
      const planetGeometry = new THREE.SphereGeometry(0.3, 32, 32);
      const planetMaterial = new THREE.MeshPhongMaterial({ color: planet.color });
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      scene.add(planetMesh);

      const orbitGeometry = new THREE.RingGeometry(planet.distance - 0.02, planet.distance + 0.02, 128);
      const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
      const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitMesh.rotation.x = Math.PI / 2;
      scene.add(orbitMesh);

      orbits.push({ planet: planetMesh, distance: planet.distance });
    });

    // Create orbit function with glow effect
    const createOrbit = (radius) => {
      const points = [];
      const numSegments = 128;

      for (let i = 0; i <= numSegments; i++) {
        const angle = (i / numSegments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        points.push(new THREE.Vector3(x, 0, z));
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x7dd3fc, linewidth: 2 });
      return new THREE.LineLoop(orbitGeometry, orbitMaterial);
    };

    // Handle NEO Asteroids
    const asteroids = [];
    const asteroidOrbits = [];
    const raycaster = new THREE.Raycaster();

    neoData.forEach((neo) => {
      if (showPHAs && neo.is_potentially_hazardous_asteroid) {
        const asteroidGeometry = new THREE.SphereGeometry(0.2, 32, 32); // Larger asteroid size
        const asteroidMaterial = new THREE.MeshPhongMaterial({
          color: 0xff3333, // Red color for hazardous asteroids
          emissive: 0x550000, // Glow effect for better visualization
          shininess: 50,
        });
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        asteroid.userData = {
          estimated_diameter: neo.estimated_diameter,
          is_potentially_hazardous_asteroid: neo.is_potentially_hazardous_asteroid,
          miss_distance: neo.close_approach_data[0]?.miss_distance.kilometers,
        };
        scene.add(asteroid);
        asteroids.push(asteroid);

        // Generate random orbital properties for each asteroid
        const randomDistance = 3 + Math.random() * 15; // Asteroids at various distances
        const randomSpeed = 0.001 + Math.random() * 0.00007; // Different speeds

        // Store asteroid orbit data for animation
        asteroid.userData.orbit = {
          distance: randomDistance,
          speed: randomSpeed,
          initialAngle: Math.random() * Math.PI * 2, // Random starting position
        };

        // Show trajectory
        if (showTrajectories) {
          const orbit = createOrbit(asteroid.userData.orbit.distance);
          asteroidOrbits.push(orbit);
          scene.add(orbit);
        }
      }
    });

    // Mouse interaction for hover
    const onMouseMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      setMouse({ x, y });

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(asteroids);
      if (intersects.length > 0) {
        setHoveredObject(intersects[0].object);
        document.body.style.cursor = 'pointer';

        const asteroidWorldPosition = new THREE.Vector3();
        intersects[0].object.getWorldPosition(asteroidWorldPosition);

        const vector = asteroidWorldPosition.project(camera);
        const widthHalf = 0.5 * window.innerWidth;
        const heightHalf = 0.5 * window.innerHeight;

        setTooltipPosition({
          x: (vector.x * widthHalf) + widthHalf,
          y: -(vector.y * heightHalf) + heightHalf - 50,
        });

        const { estimated_diameter, is_potentially_hazardous_asteroid, miss_distance } = intersects[0].object.userData;

        const missDistanceValue = miss_distance ? parseFloat(miss_distance) : null;
        
        setHoveredObjectData({
          size_meters_min: estimated_diameter.meters.estimated_diameter_min.toFixed(2),
          size_meters_max: estimated_diameter.meters.estimated_diameter_max.toFixed(2),
          size_miles_min: estimated_diameter.miles.estimated_diameter_min.toFixed(2),
          size_miles_max: estimated_diameter.miles.estimated_diameter_max.toFixed(2),
          miss_distance: missDistanceValue ? missDistanceValue.toFixed(2) : 'N/A',
          is_hazardous: is_potentially_hazardous_asteroid,
        });
      } else {
        setHoveredObject(null);
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;

    // Camera setup
    camera.position.z = 20;

    // Animation loop for planets and asteroids
    const animate = () => {
      requestAnimationFrame(animate);

      // Update planets orbits
      orbits.forEach((orbit) => {
        orbit.planet.position.x = orbit.distance * Math.cos(Date.now() * 0.001 / orbit.distance);
        orbit.planet.position.z = orbit.distance * Math.sin(Date.now() * 0.001 / orbit.distance);
      });

      // Update asteroid orbits (using Keplerian motion simulation or simplified circular paths)
      asteroids.forEach((asteroid) => {
        const { distance, speed, initialAngle } = asteroid.userData.orbit;
        const time = Date.now() * speed + initialAngle;
        asteroid.position.x = distance * Math.cos(time);
        asteroid.position.z = distance * Math.sin(time);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [neoData, showPHAs, showTrajectories]);

  return (
    <div ref={mountRef} className="w-full h-full relative">
      {hoveredObject && hoveredObjectData && (
        <div className="absolute p-2 bg-gray-900 text-white text-xs rounded" style={{ top: tooltipPosition.y, left: tooltipPosition.x }}>
          <p>
            <strong>Size:</strong> {hoveredObjectData.size_meters_min} - {hoveredObjectData.size_meters_max} meters <br />
            <strong>Miss Distance:</strong> {hoveredObjectData.miss_distance} km <br />
            <strong>Hazardous:</strong>{' '}
            {hoveredObjectData.is_hazardous ? <span className="text-red-500">Yes</span> : 'No'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Orrery;
