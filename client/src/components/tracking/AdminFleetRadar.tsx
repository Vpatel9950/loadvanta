import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { Radio, Truck, Navigation, Gauge, Zap, MapPin, RefreshCw, Phone, User, Package, Search } from 'lucide-react';

interface ActiveTripData {
  _id: string;
  bookingNumber: string;
  status: string;
  agreedPriceInr: number;
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

export const AdminFleetRadar: React.FC = () => {
  const [activeTrips, setActiveTrips] = useState<ActiveTripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<ActiveTripData | null>(null);

  // Live dynamic map of current locations: bookingId -> location
  const [liveLocations, setLiveLocations] = useState<
    Record<string, { latitude: number; longitude: number; speed: number; heading: number; checkpointNote?: string }>
  >({});

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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

        // Update marker on Google Map if initialized
        if (markersRef.current[payload.bookingId] && (window as any).google) {
          const google = (window as any).google;
          const newPos = new google.maps.LatLng(payload.latitude, payload.longitude);
          markersRef.current[payload.bookingId].setPosition(newPos);
        }
      }
    };

    socket.on('fleet:location_update', onFleetLocationUpdate);

    return () => {
      socket.off('fleet:location_update', onFleetLocationUpdate);
    };
  }, []);

  // Initialize Admin Master Google Map
  useEffect(() => {
    if (!mapRef.current || !(window as any).google || !(window as any).google.maps) return;

    try {
      const google = (window as any).google;

      // Center around Punjab / North India highway nexus (Ludhiana)
      const map = new google.maps.Map(mapRef.current, {
        zoom: 7,
        center: { lat: 30.7046, lng: 76.2168 },
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        fullscreenControl: true,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
        ]
      });
      googleMapRef.current = map;

      // Render markers for all active trips
      activeTrips.forEach((trip) => {
        const loc = liveLocations[trip._id];
        // If genuine GPS fix exists, use it. Otherwise, place at pickup city origin
        const originFallback =
          (trip.shipmentId?.pickupCity && {
            'Bathinda': { lat: 30.2110, lng: 74.9455 },
            'Ludhiana': { lat: 30.9010, lng: 75.8573 },
            'Jalandhar': { lat: 31.3260, lng: 75.5762 },
            'Amritsar': { lat: 31.6340, lng: 74.8723 },
            'Patiala': { lat: 30.3398, lng: 76.3869 },
            'Mohali': { lat: 30.7046, lng: 76.7179 },
            'Chandigarh': { lat: 30.7333, lng: 76.7794 },
            'Delhi': { lat: 28.7041, lng: 77.1025 }
          }[trip.shipmentId.pickupCity]) || { lat: 30.9010, lng: 75.8573 };

        const lat = loc ? loc.latitude : originFallback.lat;
        const lng = loc ? loc.longitude : originFallback.lng;
        const isLive = !!loc;

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: `${trip.vehicleId?.registrationNumber || 'Truck'} | ${isLive ? `${loc.speed} km/h (LIVE)` : 'STANDBY (Awaiting GPS)'}`,
          label: {
            text: isLive ? '🚚' : '📍',
            fontSize: '20px'
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="font-family: sans-serif; padding: 6px; color: #0F172A; font-size: 12px;">
              <strong style="color: #F97316; font-size: 14px;">${trip.vehicleId?.registrationNumber || 'Truck'}</strong><br/>
              <b>Status:</b> ${isLive ? `<span style="color: #16A34A; font-weight: bold;">LIVE (${loc.speed} km/h)</span>` : '<span style="color: #64748B;">OFFLINE / STANDBY</span>'}<br/>
              <b>Route:</b> ${trip.shipmentId?.pickupCity} ➔ ${trip.shipmentId?.deliveryCity}<br/>
              <b>Cargo:</b> ${trip.shipmentId?.title} (${trip.shipmentId?.weightTons}T)<br/>
              <b>Transporter:</b> ${trip.transporterId?.fullName} (${trip.transporterId?.phone})
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          setSelectedTrip(trip);
        });

        markersRef.current[trip._id] = marker;
      });
    } catch {
      // Map init error handled gracefully
    }
  }, [activeTrips]);

  const filteredTrips = activeTrips.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.bookingNumber.toLowerCase().includes(q) ||
      (t.vehicleId?.registrationNumber || '').toLowerCase().includes(q) ||
      (t.shipmentId?.pickupCity || '').toLowerCase().includes(q) ||
      (t.shipmentId?.deliveryCity || '').toLowerCase().includes(q) ||
      (t.transporterId?.fullName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Metrics */}
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
            Real-time WebSocket tracking of all commercial trucks traversing Punjab & North India corridors
          </p>
        </div>

        <div className="flex items-center space-x-4 text-center">
          <div className="bg-slate-950/60 px-4 py-2 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Trucks</span>
            <span className="text-xl font-black text-brand-orange">{activeTrips.length}</span>
          </div>
          <div className="bg-slate-950/60 px-4 py-2 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Freight in Transit</span>
            <span className="text-xl font-black text-green-400">
              {activeTrips.reduce((acc, curr) => acc + (curr.shipmentId?.weightTons || 0), 0)} T
            </span>
          </div>
          <button
            onClick={loadRadarData}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors"
            title="Refresh Fleet Data"
          >
            <RefreshCw className="w-4 h-4" />
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
          placeholder="Search by truck number (e.g. PB10TEST2527), booking ID, city, or driver..."
          className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 mr-2">
            Clear
          </button>
        )}
      </div>

      {/* Master Radar Google Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-white">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            <span className="font-bold">LIVE RADAR MAP</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Click any truck to inspect live driver telemetry</span>
          </div>
          <div className="text-[11px] text-brand-orange font-mono font-bold">
            {Object.keys(liveLocations).length} GPS Signals Active
          </div>
        </div>

        <div ref={mapRef} className="w-full h-96" />
      </div>

      {/* Active Fleet Grid / Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          In-Transit Fleet Directory ({filteredTrips.length})
        </h3>

        {filteredTrips.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-slate-400 text-sm">
            No commercial vehicles currently matching search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrips.map((trip) => {
              const loc = liveLocations[trip._id];
              const isSelected = selectedTrip?._id === trip._id;

              return (
                <div
                  key={trip._id}
                  onClick={() => {
                    setSelectedTrip(trip);
                    if (loc && googleMapRef.current) {
                      googleMapRef.current.panTo({ lat: loc.latitude, lng: loc.longitude });
                      googleMapRef.current.setZoom(10);
                    }
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand-orange bg-orange-50/20 dark:bg-orange-950/20 shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white">
                      {trip.vehicleId?.registrationNumber || 'Commercial Truck'}
                    </span>
                    {loc ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                        <span>{loc.speed} km/h (LIVE)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        OFFLINE
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {trip.shipmentId?.title}
                  </h4>

                  <div className="my-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <div>
                      Corridor: <strong>{trip.shipmentId?.pickupCity} ➔ {trip.shipmentId?.deliveryCity}</strong>
                    </div>
                    <div>
                      Payload: <strong>{trip.shipmentId?.weightTons}T {trip.shipmentId?.cargoType}</strong>
                    </div>
                    <div>
                      Transporter: <strong>{trip.transporterId?.fullName}</strong> ({trip.transporterId?.phone})
                    </div>
                    {loc?.checkpointNote && (
                      <div className="text-brand-orange font-semibold truncate">
                        Loc: {loc.checkpointNote}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span className="font-mono">ID: {trip.bookingNumber}</span>
                    <span className="text-brand-orange font-bold">₹{trip.agreedPriceInr.toLocaleString('en-IN')}</span>
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
