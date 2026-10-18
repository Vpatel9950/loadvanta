/**
 * Road Network & Distance Matrix Engine for Punjab and North India
 * Computes realistic road travel distances, durations, and detour calculations.
 */

// City coordinates (Latitude, Longitude) for road distance estimation
export interface CityCoordinates {
  name: string;
  lat: number;
  lng: number;
  state: string;
  isHub: boolean;
}

export const PUNJAB_NORTH_CITIES: Record<string, CityCoordinates> = {
  'Ludhiana': { name: 'Ludhiana', lat: 30.9010, lng: 75.8573, state: 'Punjab', isHub: true },
  'Jalandhar': { name: 'Jalandhar', lat: 31.3260, lng: 75.5762, state: 'Punjab', isHub: true },
  'Amritsar': { name: 'Amritsar', lat: 31.6340, lng: 74.8723, state: 'Punjab', isHub: true },
  'Bathinda': { name: 'Bathinda', lat: 30.2110, lng: 74.9455, state: 'Punjab', isHub: true },
  'Patiala': { name: 'Patiala', lat: 30.3398, lng: 76.3869, state: 'Punjab', isHub: true },
  'Mohali': { name: 'Mohali', lat: 30.7046, lng: 76.7179, state: 'Punjab', isHub: true },
  'Chandigarh': { name: 'Chandigarh', lat: 30.7333, lng: 76.7794, state: 'Chandigarh', isHub: true },
  'Mandi Gobindgarh': { name: 'Mandi Gobindgarh', lat: 30.6657, lng: 76.2974, state: 'Punjab', isHub: true }, // Steel Town
  'Khanna': { name: 'Khanna', lat: 30.7071, lng: 76.2168, state: 'Punjab', isHub: true }, // Largest Grain Market
  'Hoshiarpur': { name: 'Hoshiarpur', lat: 31.5273, lng: 75.9142, state: 'Punjab', isHub: false },
  'Pathankot': { name: 'Pathankot', lat: 32.2689, lng: 75.6499, state: 'Punjab', isHub: false },
  'Firozpur': { name: 'Firozpur', lat: 30.9237, lng: 74.6138, state: 'Punjab', isHub: false },
  'Moga': { name: 'Moga', lat: 30.8165, lng: 75.1717, state: 'Punjab', isHub: false },
  'Barnala': { name: 'Barnala', lat: 30.3819, lng: 75.5467, state: 'Punjab', isHub: false },
  'Sangrur': { name: 'Sangrur', lat: 30.2458, lng: 75.8421, state: 'Punjab', isHub: false },
  'Abohar': { name: 'Abohar', lat: 30.1453, lng: 74.1994, state: 'Punjab', isHub: false },
  'Delhi': { name: 'Delhi', lat: 28.7041, lng: 77.1025, state: 'Delhi', isHub: true },
  'Ambala': { name: 'Ambala', lat: 30.3782, lng: 76.7767, state: 'Haryana', isHub: true },
  'Panipat': { name: 'Panipat', lat: 29.3909, lng: 76.9635, state: 'Haryana', isHub: true },
  'Jaipur': { name: 'Jaipur', lat: 26.9124, lng: 75.7873, state: 'Rajasthan', isHub: true }
};

// Known actual highway road distances (in km) for major freight corridors
const HIGHWAY_ROAD_DISTANCES_KM: Record<string, number> = {
  'Ludhiana-Jalandhar': 62,
  'Jalandhar-Ludhiana': 62,
  'Ludhiana-Amritsar': 142,
  'Amritsar-Ludhiana': 142,
  'Jalandhar-Amritsar': 81,
  'Amritsar-Jalandhar': 81,
  'Ludhiana-Chandigarh': 105,
  'Chandigarh-Ludhiana': 105,
  'Ludhiana-Mohali': 100,
  'Mohali-Ludhiana': 100,
  'Ludhiana-Delhi': 315,
  'Delhi-Ludhiana': 315,
  'Jalandhar-Delhi': 375,
  'Delhi-Jalandhar': 375,
  'Amritsar-Delhi': 450,
  'Delhi-Amritsar': 450,
  'Ludhiana-Bathinda': 145,
  'Bathinda-Ludhiana': 145,
  'Patiala-Ludhiana': 94,
  'Ludhiana-Patiala': 94,
  'Patiala-Delhi': 250,
  'Delhi-Patiala': 250,
  'Chandigarh-Delhi': 245,
  'Delhi-Chandigarh': 245,
  'Mandi Gobindgarh-Ludhiana': 55,
  'Ludhiana-Mandi Gobindgarh': 55,
  'Mandi Gobindgarh-Delhi': 260,
  'Delhi-Mandi Gobindgarh': 260,
  'Khanna-Ludhiana': 45,
  'Ludhiana-Khanna': 45,
  'Jalandhar-Pathankot': 112,
  'Pathankot-Jalandhar': 112,
  'Bathinda-Delhi': 330,
  'Delhi-Bathinda': 330
};

// Haversine formula with road winding factor (~1.25x for Indian National/State Highways)
function calculateHaversineRoadDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;
  // Road factor for Indian highway routes
  return Math.round(straightLineKm * 1.25);
}

export function getRoadDistanceKm(originCity: string, destinationCity: string): { distanceKm: number; isEstimate: boolean } {
  const origin = originCity.trim();
  const destination = destinationCity.trim();

  if (origin.toLowerCase() === destination.toLowerCase()) {
    return { distanceKm: 15, isEstimate: false }; // Intra-city local transport
  }

  const routeKey = `${origin}-${destination}`;
  if (HIGHWAY_ROAD_DISTANCES_KM[routeKey]) {
    return { distanceKm: HIGHWAY_ROAD_DISTANCES_KM[routeKey], isEstimate: false };
  }

  const c1 = PUNJAB_NORTH_CITIES[origin];
  const c2 = PUNJAB_NORTH_CITIES[destination];

  if (c1 && c2) {
    const dist = calculateHaversineRoadDistance(c1.lat, c1.lng, c2.lat, c2.lng);
    return { distanceKm: dist, isEstimate: true };
  }

  // Fallback default inter-district highway estimate
  return { distanceKm: 150, isEstimate: true };
}

export function estimateTransitDurationHours(distanceKm: number): number {
  // Average freight truck speed on North Indian corridors: ~40 km/h accounting for toll gates & traffic
  const hours = distanceKm / 40;
  return Math.round(hours * 10) / 10;
}
