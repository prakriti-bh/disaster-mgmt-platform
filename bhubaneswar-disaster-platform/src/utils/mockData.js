// Random data generation utilities
import { v4 as uuidv4 } from 'uuid';

const BHUBANESWAR_BOUNDS = {
  north: 20.3279,
  south: 20.2079,
  east: 85.9141,
  west: 85.7441
};

// Generate a random location within Bhubaneswar bounds
const getRandomLocation = () => ({
  lat: BHUBANESWAR_BOUNDS.south + Math.random() * (BHUBANESWAR_BOUNDS.north - BHUBANESWAR_BOUNDS.south),
  lng: BHUBANESWAR_BOUNDS.west + Math.random() * (BHUBANESWAR_BOUNDS.east - BHUBANESWAR_BOUNDS.west)
});

const DISASTER_TYPES = ['flood', 'fire', 'earthquake', 'cyclone', 'building_collapse'];
const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];
const RESOURCE_TYPES = ['shelter', 'medical', 'food', 'water', 'other'];

// Generate mock reports
export const generateMockReport = () => ({
  reportId: uuidv4(),
  type: DISASTER_TYPES[Math.floor(Math.random() * DISASTER_TYPES.length)],
  severity: SEVERITY_LEVELS[Math.floor(Math.random() * SEVERITY_LEVELS.length)],
  description: `Mock ${DISASTER_TYPES[Math.floor(Math.random() * DISASTER_TYPES.length)]} incident report`,
  location: getRandomLocation(),
  timestamp: new Date().toISOString(),
  status: 'active',
  isAnonymous: Math.random() > 0.5,
  mediaUrls: [],
  contact: Math.random() > 0.5 ? {
    name: 'Mock Reporter',
    phone: '+91987654321' + Math.floor(Math.random() * 9),
    email: `mock${Math.floor(Math.random() * 100)}@example.com`
  } : undefined
});

// Generate mock resources
export const generateMockResource = () => ({
  resourceId: uuidv4(),
  name: `Mock ${RESOURCE_TYPES[Math.floor(Math.random() * RESOURCE_TYPES.length)]} Center`,
  type: RESOURCE_TYPES[Math.floor(Math.random() * RESOURCE_TYPES.length)],
  description: 'Mock resource center providing assistance',
  location: getRandomLocation(),
  capacity: {
    total: Math.floor(Math.random() * 200) + 50,
    available: Math.floor(Math.random() * 50)
  },
  contact: {
    name: 'Resource Manager',
    phone: '+91876543' + Math.floor(Math.random() * 10000),
    email: 'resource@mock.com'
  },
  status: 'active'
});

// Generate mock alerts
export const generateMockAlert = () => ({
  alertId: uuidv4(),
  type: DISASTER_TYPES[Math.floor(Math.random() * DISASTER_TYPES.length)],
  severity: SEVERITY_LEVELS[Math.floor(Math.random() * SEVERITY_LEVELS.length)],
  title: `Mock ${SEVERITY_LEVELS[Math.floor(Math.random() * SEVERITY_LEVELS.length)]} Alert`,
  description: 'This is a mock alert for testing purposes',
  area: {
    center: getRandomLocation(),
    radius: Math.floor(Math.random() * 5000) + 1000 // radius in meters
  },
  timestamp: new Date().toISOString(),
  expiresAt: new Date(Date.now() + Math.floor(Math.random() * 86400000)).toISOString(), // Random expiry within 24h
  status: 'active'
});

// Real-time simulation
let simulationInterval;

export const startRealtimeSimulation = (callbacks) => {
  // Stop any existing simulation
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }

  simulationInterval = setInterval(() => {
    // Randomly decide which type of update to simulate
    const rand = Math.random();
    
    if (rand < 0.4) { // 40% chance for new report
      callbacks.onNewReport?.(generateMockReport());
    } else if (rand < 0.7) { // 30% chance for new resource
      callbacks.onNewResource?.(generateMockResource());
    } else { // 30% chance for new alert
      callbacks.onNewAlert?.(generateMockAlert());
    }
  }, 30000); // Generate new data every 30 seconds

  return () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }
  };
};

// Generate initial mock data
export const generateInitialMockData = () => ({
  reports: Array.from({ length: 10 }, generateMockReport),
  resources: Array.from({ length: 15 }, generateMockResource),
  alerts: Array.from({ length: 5 }, generateMockAlert)
});