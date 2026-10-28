import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../lib/socket';
import { Navigation, Play, Square, Compass, Gauge, Radio, AlertCircle, CheckCircle2, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

interface DriverGpsControllerProps {
  bookingId: string;
  vehicleId: string;
  truckRegistration?: string;
  pickupCity: string;
  deliveryCity: string;
  onLocationSent?: (loc: { latitude: number; longitude: number; speed: number; heading: number }) => void;
}

// Calculate distance between two lat/lng points in km (Haversine formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate bearing between two consecutive GPS fixes
function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export const DriverGpsController: React.FC<DriverGpsControllerProps> = ({
  bookingId,
  vehicleId,
  truckRegistration = 'Commercial Truck',
  pickupCity,
  deliveryCity,
  onLocationSent
}) => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [currentAccuracy, setCurrentAccuracy] = useState<number>(0);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [packetsSent, setPacketsSent] = useState<number>(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const watchIdRef = useRef<number | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  const socket = getSocket();

  // Check initial permission status if supported by browser
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          setPermissionState(result.state as any);
          result.onchange = () => {
            setPermissionState(result.state as any);
          };
        })
        .catch(() => {});
    }
  }, []);

  // Start Actual Device Geolocation using navigator.geolocation.watchPosition()
  const startGpsBroadcast = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your current browser.');
      return;
    }

    setGpsError(null);
    setIsBroadcasting(true);
    socket.emit('driver:toggle_tracking', { bookingId, isActive: true });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading, accuracy } = position.coords;

        // Calculate genuine speed in km/h:
        // Use device speed (m/s) if available and valid; otherwise calculate from distance & time
        let speedKmh = 0;
        if (typeof speed === 'number' && speed > 0 && !isNaN(speed)) {
          speedKmh = Math.round(speed * 3.6);
        } else if (lastCoordsRef.current) {
          const now = Date.now();
          const timeDiffHours = (now - lastTimeRef.current) / (1000 * 3600);
          if (timeDiffHours > 0) {
            const distKm = getDistanceFromLatLonInKm(
              lastCoordsRef.current.lat,
              lastCoordsRef.current.lng,
              latitude,
              longitude
            );
            // Ignore minor GPS drift under 5 meters
            if (distKm > 0.005) {
              speedKmh = Math.min(Math.round(distKm / timeDiffHours), 130);
            }
          }
        }

        // Calculate genuine heading / direction
        let headingDeg = 0;
        if (typeof heading === 'number' && !isNaN(heading) && heading >= 0) {
          headingDeg = Math.round(heading);
        } else if (lastCoordsRef.current) {
          const distKm = getDistanceFromLatLonInKm(
            lastCoordsRef.current.lat,
            lastCoordsRef.current.lng,
            latitude,
            longitude
          );
          if (distKm > 0.005) {
            headingDeg = Math.round(
              calculateBearing(lastCoordsRef.current.lat, lastCoordsRef.current.lng, latitude, longitude)
            );
          } else {
            headingDeg = currentHeading;
          }
        }

        lastCoordsRef.current = { lat: latitude, lng: longitude };
        lastTimeRef.current = Date.now();

        setLastCoords({ lat: latitude, lng: longitude });
        setCurrentSpeed(speedKmh);
        setCurrentHeading(headingDeg);
        setCurrentAccuracy(Math.round(accuracy || 0));
        setPacketsSent((p) => p + 1);
        setPermissionState('granted');

        // Emit genuine GPS coordinates over Socket.IO to backend
        const payload = {
          bookingId,
          vehicleId,
          latitude,
          longitude,
          heading: headingDeg,
          speed: speedKmh,
          accuracy: Math.round(accuracy || 0),
          timestamp: Date.now()
        };

        socket.emit('driver:location_update', payload);

        if (onLocationSent) {
          onLocationSent({ latitude, longitude, speed: speedKmh, heading: headingDeg });
        }
      },
      (err) => {
        console.warn('[Driver GPS Watch Error]', err.code, err.message);
        if (err.code === 1) {
          // PERMISSION_DENIED
          setPermissionState('denied');
          setGpsError(
            'Location permission denied. Please click the lock icon in your browser address bar and enable Location access to start tracking.'
          );
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          setGpsError('Location unavailable. Please make sure your device GPS / Location Services are turned ON.');
        } else if (err.code === 3) {
          // TIMEOUT
          setGpsError('Location request timed out while locking onto GPS satellite. Retrying...');
        } else {
          setGpsError(`GPS Error: ${err.message}`);
        }
        stopGpsBroadcast();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const stopGpsBroadcast = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsBroadcasting(false);
    setCurrentSpeed(0);
    socket.emit('driver:toggle_tracking', { bookingId, isActive: false });
  };

  const handleToggle = () => {
    if (isBroadcasting) {
      stopGpsBroadcast();
    } else {
      startGpsBroadcast();
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      socket.emit('driver:toggle_tracking', { bookingId, isActive: false });
    };
  }, [bookingId]);

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-md p-4 text-white shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Radio className={`w-5 h-5 ${isBroadcasting ? 'text-green-400 animate-pulse' : 'text-slate-400'}`} />
            {isBroadcasting && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Driver Live GPS Transmitter (Rapido / Zomato Real-Time)
            </h4>
            <div className="text-[11px] text-slate-400">
              Vehicle: <strong className="text-brand-orange font-mono">{truckRegistration}</strong> | Route:{' '}
              <span className="text-slate-200">{pickupCity} ➔ {deliveryCity}</span>
            </div>
          </div>
        </div>

        {/* Start / Stop Button */}
        <div>
          <button
            type="button"
            onClick={handleToggle}
            className={`px-5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 shadow-lg transition-all transform active:scale-95 ${
              isBroadcasting
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isBroadcasting ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Live Tracking</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Live Tracking</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Permission Denied / Error Alert */}
      {gpsError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">GPS Transmission Alert</span>
            <span>{gpsError}</span>
          </div>
        </div>
      )}

      {/* Genuine Telemetry Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Real Speedometer */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-orange-500/10 text-brand-orange">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Actual Speed</div>
            <div className="text-lg font-black text-white font-mono">
              {isBroadcasting ? currentSpeed : 0} <span className="text-xs font-normal text-slate-400">km/h</span>
            </div>
          </div>
        </div>

        {/* Heading Bearing */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Compass className="w-5 h-5" style={{ transform: `rotate(${currentHeading}deg)` }} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Bearing</div>
            <div className="text-lg font-black text-white font-mono">
              {currentHeading}°
            </div>
          </div>
        </div>

        {/* GPS Accuracy */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Accuracy</div>
            <div className="text-sm font-black text-slate-200 font-mono">
              {isBroadcasting && currentAccuracy > 0 ? `±${currentAccuracy}m` : 'Standby'}
            </div>
          </div>
        </div>

        {/* Live Stream State */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Stream Status</div>
            <div className="text-xs font-black">
              {isBroadcasting ? (
                <span className="text-green-400 flex items-center space-x-1">
                  <span>LIVE</span>
                  <span className="text-[10px] text-slate-400">({packetsSent} pings)</span>
                </span>
              ) : (
                <span className="text-slate-500">OFFLINE</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actual Coordinates Readout */}
      {isBroadcasting && lastCoords && (
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 font-mono">
          <div>
            GPS Fix: Lat <strong className="text-slate-200">{lastCoords.lat.toFixed(6)}</strong>, Lng{' '}
            <strong className="text-slate-200">{lastCoords.lng.toFixed(6)}</strong>
          </div>
          <div className="text-green-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Broadcasting genuine device GPS via WebSocket to Shipper</span>
          </div>
        </div>
      )}
    </div>
  );
};
