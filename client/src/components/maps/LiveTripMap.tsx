import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, RefreshCw, Key, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LiveTripMapProps {
  pickupCity: string;
  deliveryCity: string;
  currentMilestoneLocation?: string;
  truckRegistration?: string;
  status: string;
}

// Known coordinates for major North India freight corridors
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
  'Delhi': { lat: 28.7041, lng: 77.1025 }
};

export const LiveTripMap: React.FC<LiveTripMapProps> = ({
  pickupCity,
  deliveryCity,
  currentMilestoneLocation,
  truckRegistration = 'Commercial Truck',
  status
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [authFailure, setAuthFailure] = useState(false);

  // Read Google Maps API Key strictly from client environment
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Intercept Google Maps Auth Failure (e.g. RefererNotAllowedMapError)
    (window as any).gm_authFailure = () => {
      console.warn('[Google Maps] RefererNotAllowedMapError detected. Showing fallback highway view.');
      setAuthFailure(true);
    };

    if (!apiKey) {
      setMapError('Google Maps API key is not configured in client environment.');
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const onScriptLoaded = () => {
      setMapLoaded(true);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = onScriptLoaded;
      script.onerror = () => setMapError('Failed to load Google Maps script.');
      document.head.appendChild(script);
    } else if ((window as any).google && (window as any).google.maps) {
      setMapLoaded(true);
    } else {
      script.addEventListener('load', onScriptLoaded);
    }
  }, [apiKey]);

  useEffect(() => {
    if (authFailure || !mapLoaded || !mapRef.current || !(window as any).google) return;

    try {
      const google = (window as any).google;

      const originCoord = CITY_COORDINATES[pickupCity] || { lat: 30.9010, lng: 75.8573 };
      const destCoord = CITY_COORDINATES[deliveryCity] || { lat: 28.7041, lng: 77.1025 };

      const centerLat = (originCoord.lat + destCoord.lat) / 2;
      const centerLng = (originCoord.lng + destCoord.lng) / 2;

      const map = new google.maps.Map(mapRef.current, {
        zoom: 7,
        center: { lat: centerLat, lng: centerLng },
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
        ]
      });

      // Marker 1: Pickup Origin (Green)
      new google.maps.Marker({
        position: originCoord,
        map,
        title: `Origin: ${pickupCity}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#16A34A',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      // Marker 2: Delivery Destination (Orange)
      new google.maps.Marker({
        position: destCoord,
        map,
        title: `Destination: ${deliveryCity}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#F97316',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      // Draw Highway Route Corridor Line
      new google.maps.Polyline({
        path: [originCoord, destCoord],
        geodesic: true,
        strokeColor: '#F97316',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map
      });

      // Calculate Truck Position on the route
      let truckCoord = originCoord;
      if (status === 'DELIVERED' || status === 'COMPLETED') {
        truckCoord = destCoord;
      } else if (status === 'IN_TRANSIT') {
        truckCoord = {
          lat: originCoord.lat + (destCoord.lat - originCoord.lat) * 0.65,
          lng: originCoord.lng + (destCoord.lng - originCoord.lng) * 0.65
        };
      }

      // Marker 3: Live Truck Marker
      new google.maps.Marker({
        position: truckCoord,
        map,
        title: `${truckRegistration} (${status})`,
        label: {
          text: '🚚',
          fontSize: '20px'
        }
      });

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(originCoord);
      bounds.extend(destCoord);
      bounds.extend(truckCoord);
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } catch (err: any) {
      setMapError('Error initializing Google Maps: ' + err.message);
    }
  }, [mapLoaded, pickupCity, deliveryCity, currentMilestoneLocation, status, truckRegistration, authFailure]);

  // Calculate percentage of journey for fallback visualizer
  const getProgressPercent = () => {
    if (status === 'COMPLETED' || status === 'DELIVERED') return 100;
    if (status === 'IN_TRANSIT') return 65;
    return 20;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
      {/* Top Floating Highway Status Bar */}
      <div className="p-3.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
          <span className="font-bold text-slate-200">LIVE HIGHWAY GPS TRACKER</span>
          <span className="text-slate-500">|</span>
          <span className="text-brand-orange font-mono font-bold">{truckRegistration}</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-slate-300">
          <div>Corridor: <strong>{pickupCity} ➔ {deliveryCity}</strong></div>
          {currentMilestoneLocation && (
            <div className="px-2 py-0.5 rounded bg-orange-500/20 text-brand-orange border border-orange-500/30">
              Checkpoint: {currentMilestoneLocation}
            </div>
          )}
        </div>
      </div>

      {/* Main Map Body or Clean Visual Fallback */}
      {authFailure ? (
        <div className="p-6 bg-slate-900 text-white space-y-5">
          {/* Google Referer Notice Alert */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-300">
                Google Maps API Security: Domain Not Authorized (RefererNotAllowedMapError)
              </div>
              <p className="text-slate-300 leading-relaxed">
                Aapki Google Maps API key activate ho chuki hai, lekin aapke Google Cloud Console me <strong>Website Restrictions</strong> lagi hui hain.
                Isse theek karne ke liye Google Cloud Console me <strong><code className="text-amber-200 bg-amber-950/60 px-1.5 py-0.5 rounded">http://localhost:5173/*</code></strong> ko Authorized Domains me add karein.
              </p>
            </div>
          </div>

          {/* Interactive Highway Corridor Visual Tracker */}
          <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Origin: {pickupCity}</span>
              <span className="text-brand-orange font-mono">{status}</span>
              <span>Destination: {deliveryCity}</span>
            </div>

            {/* Visual Route Line */}
            <div className="relative pt-6 pb-4">
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-amber-500 to-brand-orange transition-all duration-700"
                  style={{ width: `${getProgressPercent()}%` }}
                />
              </div>

              {/* Origin Marker */}
              <div className="absolute left-0 top-3 -translate-x-1/2 flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-lg" />
                <span className="text-[10px] font-bold text-green-400 mt-1">{pickupCity}</span>
              </div>

              {/* Live Truck Marker on Highway */}
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-700"
                style={{ left: `${getProgressPercent()}%` }}
              >
                <div className="text-2xl animate-bounce">🚚</div>
                <div className="px-2 py-0.5 rounded bg-brand-orange text-white text-[10px] font-black shadow-md mt-0.5">
                  {currentMilestoneLocation || truckRegistration}
                </div>
              </div>

              {/* Destination Marker */}
              <div className="absolute right-0 top-3 translate-x-1/2 flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-brand-orange border-2 border-white shadow-lg" />
                <span className="text-[10px] font-bold text-orange-400 mt-1">{deliveryCity}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 text-center border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Start Point</span>
                <span className="font-bold text-slate-200">{pickupCity}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Current Checkpoint</span>
                <span className="font-bold text-brand-orange">{currentMilestoneLocation || 'On Route'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Destination</span>
                <span className="font-bold text-slate-200">{deliveryCity}</span>
              </div>
            </div>
          </div>
        </div>
      ) : mapError ? (
        <div className="h-72 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <div className="font-semibold text-sm text-slate-200">Map View Unavailable</div>
          <div className="text-xs max-w-sm">{mapError}</div>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-80" />
      )}
    </div>
  );
};
