import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import {
  Radio,
  Truck,
  Navigation,
  Gauge,
  Zap,
  MapPin,
  RefreshCw,
  Phone,
  User,
  Package,
  Search,
  Layers,
  Globe,
  Crosshair,
  Maximize2,
  CheckCircle2
} from 'lucide-react';

interface ActiveTripData {
  _id: string;
  bookingNumber?: string;
  status: string;
  agreedPriceInr?: number;
  vehicleId?: {
    _id: string;
    registrationNumber: string;
    vehicleType: string;
    bodyType: string;
    capacityTons: number;
    currentCity: string;
    lastKnownLocation?: {
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    };
  };
  shipperId?: {
    fullName: string;
    companyName: string;
    phone: string;
    city: string;
  };
  transporterId?: {
    fullName: string;
    companyName: string;
    phone: string;
    city: string;
  };
  shipmentId?: {
    title: string;
    pickupCity: string;
    deliveryCity: string;
    cargoType: string;
    weightTons: number;
  };
  liveTracking?: {
    lastKnownLocation?: {
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      timestamp?: any;
    };
    isActive?: boolean;
  };
}

// Known coordinates for Punjab & North India logistics corridor
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Bathinda': { lat: 30.2110, lng: 74.9455 },
  'Ludhiana': { lat: 30.9010, lng: 75.8573 },
  'Jalandhar': { lat: 31.3260, lng: 75.5762 },
  'Amritsar': { lat: 31.6340, lng: 74.8723 },
  'Patiala': { lat: 30.3398, lng: 76.3869 },
  'Mohali': { lat: 30.7046, lng: 76.7179 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Khanna': { lat: 30.7071, lng: 76.2168 },
  'Mandi Gobindgarh': { lat: 30.6657, lng: 76.2974 },
  'Ambala': { lat: 30.3782, lng: 76.7767 },
  'Panipat': { lat: 29.3909, lng: 76.9635 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Pathankot': { lat: 32.2684, lng: 75.6527 },
  'Hoshiarpur': { lat: 31.5273, lng: 75.9142 },
  'Firozpur': { lat: 30.9237, lng: 74.6136 },
  'Faridkot': { lat: 30.6769, lng: 74.7583 },
  'Sangrur': { lat: 30.2458, lng: 75.8421 },
  'Mansa': { lat: 29.9880, lng: 75.3934 },
  'Kharar': { lat: 30.7415, lng: 76.6467 },
  'Rupnagar': { lat: 30.9664, lng: 76.5331 }
};

export const AdminFleetRadar: React.FC = () => {
  const [activeTrips, setActiveTrips] = useState<ActiveTripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<ActiveTripData | null>(null);

  // Map Engine: 'osm' (OpenStreetMap via Leaflet) by default so it never fails, or 'google'
  const [mapEngine, setMapEngine] = useState<'osm' | 'google'>('osm');
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Live dynamic map of current locations: bookingId -> location
  const [liveLocations, setLiveLocations] = useState<
    Record<string, { latitude: number; longitude: number; speed: number; heading: number; checkpointNote?: string }>
  >({});

  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersRef = useRef<Record<string, any>>({});

  const googleContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const googleMarkersRef = useRef<Record<string, any>>({});

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 1. Fetch Fleet Radar Data (All In-Transit Trips + All Transporter Vehicles)
  const loadRadarData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/fleet-radar');
      if (res.data.success) {
        const trips: ActiveTripData[] = res.data.data || [];
        setActiveTrips(trips);

        // Pre-populate any existing DB locations
        const initialLocs: Record<string, any> = {};
        trips.forEach((t) => {
          const loc = t.liveTracking?.lastKnownLocation || t.vehicleId?.lastKnownLocation;
          if (loc && loc.latitude && loc.longitude) {
            initialLocs[t._id] = {
              latitude: loc.latitude,
              longitude: loc.longitude,
              speed: loc.speed || 0,
              heading: loc.heading || 0
            };
          }
        });
        setLiveLocations((prev) => ({ ...prev, ...initialLocs }));
      }
    } catch (err) {
      console.error('[Fleet Radar] Failed to fetch trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRadarData();

    // Setup WebSocket connection to admin radar room
    const socket = getSocket();
    socket.emit('join_admin_radar');

    const onFleetLocationUpdate = (payload: any) => {
      if (payload && payload.bookingId && payload.latitude && payload.longitude) {
        setLiveLocations((prev) => ({
          ...prev,
          [payload.bookingId]: {
            latitude: payload.latitude,
            longitude: payload.longitude,
            speed: payload.speed || 0,
            heading: payload.heading || 0,
            checkpointNote: payload.checkpointNote
          }
        }));

        // Live Leaflet Marker Update
        if (leafletMarkersRef.current[payload.bookingId]) {
          leafletMarkersRef.current[payload.bookingId].setLatLng([payload.latitude, payload.longitude]);
        }

        // Live Google Marker Update
        if (googleMarkersRef.current[payload.bookingId] && (window as any).google) {
          const google = (window as any).google;
          googleMarkersRef.current[payload.bookingId].setPosition(
            new google.maps.LatLng(payload.latitude, payload.longitude)
          );
        }
      }
    };

    socket.on('fleet:location_update', onFleetLocationUpdate);

    return () => {
      socket.off('fleet:location_update', onFleetLocationUpdate);
    };
  }, []);

  // 2. Load Leaflet CDN Assets for OpenStreetMap
  useEffect(() => {
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const scriptId = 'leaflet-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else if ((window as any).L) {
      setLeafletLoaded(true);
    } else {
      script.addEventListener('load', () => setLeafletLoaded(true));
    }
  }, []);

  // 3. Load Google Maps if switched to Google Engine
  useEffect(() => {
    if (mapEngine !== 'google') return;

    if (!apiKey) {
      console.warn('[Google Maps] No API key configured, falling back to OpenStreetMap');
      setMapEngine('osm');
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.onload = () => setGoogleLoaded(true);
      document.head.appendChild(script);
    } else if ((window as any).google) {
      setGoogleLoaded(true);
    } else {
      script.addEventListener('load', () => setGoogleLoaded(true));
    }
  }, [mapEngine, apiKey]);

  // Helper: Calculate deterministic position for a vehicle
  const getVehicleCoordinates = (trip: ActiveTripData, index: number): [number, number] => {
    const live = liveLocations[trip._id];
    if (live && live.latitude && live.longitude) {
      return [live.latitude, live.longitude];
    }
    const dbLoc = trip.vehicleId?.lastKnownLocation || trip.liveTracking?.lastKnownLocation;
    if (dbLoc && dbLoc.latitude && dbLoc.longitude) {
      return [dbLoc.latitude, dbLoc.longitude];
    }

    // Fallback to city coordinates with deterministic jitter so multiple trucks in same city don't stack
    const city = trip.shipmentId?.pickupCity || trip.vehicleId?.currentCity || 'Ludhiana';
    const base = CITY_COORDINATES[city] || { lat: 30.9010, lng: 75.8573 };

    const latJitter = ((index % 5) - 2) * 0.015;
    const lngJitter = (Math.floor(index / 5) - 1) * 0.018;

    return [base.lat + latJitter, base.lng + lngJitter];
  };

  // 4. Initialize & Render Leaflet (OpenStreetMap)
  useEffect(() => {
    if (mapEngine !== 'osm' || !leafletLoaded || !leafletContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        zoomControl: true
      }).setView([30.9010, 75.8573], 8); // Punjab nexus (Ludhiana)

      // Modern clean tiles with street detail
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(leafletMarkersRef.current).forEach((m: any) => {
      try {
        map.removeLayer(m);
      } catch {}
    });
    leafletMarkersRef.current = {};

    const markerBounds: [number, number][] = [];

    activeTrips.forEach((trip, idx) => {
      const [lat, lng] = getVehicleCoordinates(trip, idx);
      markerBounds.push([lat, lng]);

      const loc = liveLocations[trip._id];
      const isLive = !!loc;
      const isInTransit = trip.status === 'IN_TRANSIT' || trip.status === 'OUT_FOR_DELIVERY' || trip.status === 'CONFIRMED';
      const reg = trip.vehicleId?.registrationNumber || 'Truck';

      // Badge Icon Styling
      const iconHtml = isLive
        ? `
          <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
            <div style="background: #16A34A; color: white; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 999px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid white; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #4ADE80; box-shadow: 0 0 6px #4ADE80;"></span>
              <span>🚚 ${reg}</span>
              <span style="font-size: 9px; opacity: 0.9;">(${loc.speed} km/h)</span>
            </div>
            <div style="width: 10px; height: 10px; background: #16A34A; border-radius: 50%; border: 2px solid white; margin-top: -2px;"></div>
          </div>
        `
        : isInTransit
        ? `
          <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
            <div style="background: #EA580C; color: white; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 999px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid white; white-space: nowrap;">
              🚚 ${reg} • In Transit
            </div>
            <div style="width: 10px; height: 10px; background: #EA580C; border-radius: 50%; border: 2px solid white; margin-top: -2px;"></div>
          </div>
        `
        : `
          <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
            <div style="background: #0284C7; color: white; font-weight: 700; font-size: 10px; padding: 2px 7px; border-radius: 999px; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 1.5px solid white; white-space: nowrap;">
              📍 ${reg} (${trip.vehicleId?.currentCity || 'Available'})
            </div>
            <div style="width: 8px; height: 8px; background: #0284C7; border-radius: 50%; border: 1.5px solid white; margin-top: -2px;"></div>
          </div>
        `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-fleet-pin',
        iconSize: [0, 0]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="font-family: sans-serif; padding: 4px 2px; min-width: 220px; color: #0F172A;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #EA580C; font-size: 14px; font-family: monospace;">${reg}</strong>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; background: ${isLive ? '#DCFCE7; color: #16A34A' : isInTransit ? '#FFEDD5; color: #C2410C' : '#E0F2FE; color: #0369A1'};">
              ${isLive ? `LIVE (${loc.speed} km/h)` : isInTransit ? 'IN TRANSIT' : 'AVAILABLE'}
            </span>
          </div>
          <div style="font-size: 11px; margin-top: 4px; line-height: 1.4;">
            <div><b>Type:</b> ${trip.vehicleId?.capacityTons || 0}T ${trip.vehicleId?.bodyType || trip.vehicleId?.vehicleType || 'Truck'}</div>
            <div><b>Transporter:</b> ${trip.transporterId?.companyName || trip.transporterId?.fullName || 'Transporter'}</div>
            ${trip.transporterId?.phone ? `<div><b>Phone:</b> <a href="tel:${trip.transporterId.phone}" style="color: #EA580C;">${trip.transporterId.phone}</a></div>` : ''}
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #CBD5E1;">
              ${isInTransit ? `<b>Route:</b> ${trip.shipmentId?.pickupCity} ➔ ${trip.shipmentId?.deliveryCity}` : `<b>Stationed at:</b> ${trip.vehicleId?.currentCity || 'Punjab'}`}
            </div>
            ${trip.shipmentId?.title && isInTransit ? `<div style="color: #475569;"><b>Cargo:</b> ${trip.shipmentId.title} (${trip.shipmentId.weightTons}T)</div>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedTrip(trip);
      });

      leafletMarkersRef.current[trip._id] = marker;
    });

    if (markerBounds.length > 0) {
      try {
        map.fitBounds(markerBounds, { padding: [50, 50], maxZoom: 10 });
      } catch {}
    }
  }, [mapEngine, leafletLoaded, activeTrips]);

  // 5. Initialize & Render Google Maps (Fallback option)
  useEffect(() => {
    if (mapEngine !== 'google' || !googleLoaded || !googleContainerRef.current) return;
    const google = (window as any).google;
    if (!google || !google.maps) return;

    if (!googleMapRef.current) {
      const map = new google.maps.Map(googleContainerRef.current, {
        zoom: 8,
        center: { lat: 30.9010, lng: 75.8573 },
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        fullscreenControl: true
      });
      googleMapRef.current = map;
    }

    const map = googleMapRef.current;
    if (!map) return;

    // Clear old google markers
    Object.values(googleMarkersRef.current).forEach((m: any) => {
      try {
        m.setMap(null);
      } catch {}
    });
    googleMarkersRef.current = {};

    const bounds = new google.maps.LatLngBounds();

    activeTrips.forEach((trip, idx) => {
      const [lat, lng] = getVehicleCoordinates(trip, idx);
      const pos = new google.maps.LatLng(lat, lng);
      bounds.extend(pos);

      const loc = liveLocations[trip._id];
      const isLive = !!loc;
      const reg = trip.vehicleId?.registrationNumber || 'Truck';

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: `${reg} | ${isLive ? `${loc.speed} km/h (LIVE)` : trip.status}`,
        label: {
          text: isLive ? '🚚' : '📍',
          fontSize: '18px'
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 4px; color: #0F172A; font-size: 12px;">
            <strong style="color: #EA580C; font-size: 14px;">${reg}</strong><br/>
            <b>Status:</b> ${isLive ? `<span style="color: #16A34A; font-weight: bold;">LIVE (${loc.speed} km/h)</span>` : trip.status}<br/>
            <b>Transporter:</b> ${trip.transporterId?.companyName || trip.transporterId?.fullName}<br/>
            <b>City:</b> ${trip.vehicleId?.currentCity || trip.shipmentId?.pickupCity}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        setSelectedTrip(trip);
      });

      googleMarkersRef.current[trip._id] = marker;
    });

    try {
      map.fitBounds(bounds);
    } catch {}
  }, [mapEngine, googleLoaded, activeTrips]);

  // Focus on a specific vehicle
  const focusVehicle = (trip: ActiveTripData, idx: number) => {
    setSelectedTrip(trip);
    const [lat, lng] = getVehicleCoordinates(trip, idx);

    if (mapEngine === 'osm' && leafletMapRef.current) {
      leafletMapRef.current.setView([lat, lng], 13);
      const marker = leafletMarkersRef.current[trip._id];
      if (marker) {
        marker.openPopup();
      }
    } else if (mapEngine === 'google' && googleMapRef.current) {
      const google = (window as any).google;
      if (google) {
        googleMapRef.current.panTo(new google.maps.LatLng(lat, lng));
        googleMapRef.current.setZoom(13);
      }
    }
  };

  // Reset to full corridor view
  const resetCorridorView = () => {
    if (mapEngine === 'osm' && leafletMapRef.current) {
      leafletMapRef.current.setView([30.9010, 75.8573], 8);
    } else if (mapEngine === 'google' && googleMapRef.current) {
      const google = (window as any).google;
      if (google) {
        googleMapRef.current.setCenter(new google.maps.LatLng(30.9010, 75.8573));
        googleMapRef.current.setZoom(8);
      }
    }
  };

  const filteredTrips = activeTrips.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.bookingNumber || '').toLowerCase().includes(q) ||
      (t.vehicleId?.registrationNumber || '').toLowerCase().includes(q) ||
      (t.vehicleId?.currentCity || '').toLowerCase().includes(q) ||
      (t.shipmentId?.pickupCity || '').toLowerCase().includes(q) ||
      (t.shipmentId?.deliveryCity || '').toLowerCase().includes(q) ||
      (t.transporterId?.fullName || '').toLowerCase().includes(q) ||
      (t.transporterId?.companyName || '').toLowerCase().includes(q)
    );
  });

  const inTransitCount = activeTrips.filter(
    (t) => t.status === 'IN_TRANSIT' || t.status === 'OUT_FOR_DELIVERY' || t.status === 'CONFIRMED'
  ).length;
  const availableCount = activeTrips.length - inTransitCount;
  const liveSignalsCount = Object.keys(liveLocations).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Platform Fleet Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-ping" />
            <h2 className="text-lg font-black tracking-tight text-white flex items-center space-x-2">
              <Radio className="w-5 h-5 text-brand-orange" />
              <span>LIVE FLEET GPS RADAR TERMINAL</span>
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Real-time tracking of all commercial transporter vehicles and in-transit freight across Punjab corridors
          </p>
        </div>

        <div className="flex items-center space-x-3 text-center">
          <div className="bg-slate-950/60 px-3.5 py-2 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Fleet</span>
            <span className="text-xl font-black text-brand-orange">{activeTrips.length}</span>
          </div>
          <div className="bg-slate-950/60 px-3.5 py-2 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">In-Transit</span>
            <span className="text-xl font-black text-amber-400">{inTransitCount}</span>
          </div>
          <div className="bg-slate-950/60 px-3.5 py-2 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Available Depot</span>
            <span className="text-xl font-black text-blue-400">{availableCount}</span>
          </div>
          <div className="bg-slate-950/60 px-3.5 py-2 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Live GPS</span>
            <span className="text-xl font-black text-green-400">{liveSignalsCount}</span>
          </div>
          <button
            onClick={loadRadarData}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
            title="Refresh Fleet Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by truck number (e.g. PB10CZ4521, UP 62 2595), city, transporter, or booking..."
          className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 mr-2 cursor-pointer">
            Clear
          </button>
        )}
      </div>

      {/* Master Radar Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
        {/* Radar Map Controls & Header */}
        <div className="p-3.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            <span className="font-bold text-sm">PUNJAB FLEET RADAR MAP</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-xs hidden sm:inline">
              Showing {activeTrips.length} commercial vehicles across Punjab highways & dry ports
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Map Engine Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setMapEngine('osm')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mapEngine === 'osm'
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                OpenStreetMap
              </button>
              <button
                type="button"
                onClick={() => setMapEngine('google')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mapEngine === 'google'
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Maps
              </button>
            </div>

            <button
              onClick={resetCorridorView}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-brand-orange" />
              <span>Corridor View</span>
            </button>
          </div>
        </div>

        {/* Map Elements */}
        {mapEngine === 'osm' ? (
          <div ref={leafletContainerRef} className="w-full h-[460px] z-10" />
        ) : (
          <div ref={googleContainerRef} className="w-full h-[460px] z-10" />
        )}

        {/* Map Legend Footer */}
        <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between px-4 text-[11px] text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-white font-medium">Live GPS In-Transit</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-orange"></span>
              <span className="text-white font-medium">In-Transit Freight</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-white font-medium">Available at City Depot</span>
            </span>
          </div>

          <div className="font-mono text-slate-400">
            Click any truck to inspect live telemetry
          </div>
        </div>
      </div>

      {/* Fleet Directory Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            All Transporter Vehicles & Active Trips ({filteredTrips.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Click card to track on map
          </span>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-slate-400 text-sm">
            No commercial vehicles matching your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrips.map((trip, idx) => {
              const loc = liveLocations[trip._id];
              const isSelected = selectedTrip?._id === trip._id;
              const isInTransit = trip.status === 'IN_TRANSIT' || trip.status === 'OUT_FOR_DELIVERY' || trip.status === 'CONFIRMED';
              const reg = trip.vehicleId?.registrationNumber || 'Commercial Truck';

              return (
                <div
                  key={trip._id}
                  onClick={() => focusVehicle(trip, idx)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand-orange bg-orange-50/20 dark:bg-orange-950/20 shadow-md ring-2 ring-brand-orange/40'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white">
                      {reg}
                    </span>
                    {loc ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                        <span>{loc.speed} km/h (LIVE)</span>
                      </span>
                    ) : isInTransit ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                        IN TRANSIT
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                        AVAILABLE
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {trip.shipmentId?.title || `${reg} (${trip.vehicleId?.capacityTons}T ${trip.vehicleId?.bodyType})`}
                  </h4>

                  <div className="my-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <div>
                      {isInTransit ? (
                        <>Corridor: <strong>{trip.shipmentId?.pickupCity} ➔ {trip.shipmentId?.deliveryCity}</strong></>
                      ) : (
                        <>Stationed at: <strong>{trip.vehicleId?.currentCity || 'Punjab Logistics Hub'}</strong></>
                      )}
                    </div>
                    <div>
                      Vehicle: <strong>{trip.vehicleId?.capacityTons}T {trip.vehicleId?.bodyType || trip.vehicleId?.vehicleType}</strong>
                    </div>
                    <div>
                      Transporter: <strong>{trip.transporterId?.companyName || trip.transporterId?.fullName}</strong>
                      {trip.transporterId?.phone && ` (${trip.transporterId.phone})`}
                    </div>
                    {loc?.checkpointNote && (
                      <div className="text-brand-orange font-semibold truncate">
                        Loc: {loc.checkpointNote}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span className="font-mono">
                      {isInTransit ? `Trip: ${trip.bookingNumber}` : `Status: Ready for Loads`}
                    </span>
                    {trip.agreedPriceInr ? (
                      <span className="text-brand-orange font-bold">₹{trip.agreedPriceInr.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-green-500 font-semibold">Available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
