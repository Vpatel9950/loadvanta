import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  RefreshCw,
  Key,
  ShieldAlert,
  CheckCircle2,
  Zap,
  Radio,
  Clock,
  Crosshair,
  Maximize2,
  Globe,
  Layers
} from 'lucide-react';
import { getSocket } from '../../lib/socket';

interface LiveTripMapProps {
  bookingId?: string;
  pickupCity: string;
  deliveryCity: string;
  currentMilestoneLocation?: string;
  truckRegistration?: string;
  status: string;
}

// Known base coordinates for North India origins/destinations
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
  bookingId,
  pickupCity,
  deliveryCity,
  currentMilestoneLocation,
  truckRegistration = 'Commercial Truck',
  status
}) => {
  // Map Engine State: 'google' (Google Maps) or 'osm' (OpenStreetMap via Leaflet)
  // Default to 'osm' so Google demo key quota limits never stop live tracking
  const [mapEngine, setMapEngine] = useState<'google' | 'osm'>('osm');
  const [quotaExceededNotice, setQuotaExceededNotice] = useState(false);

  // Google Maps Refs
  const googleMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const truckMarkerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const breadcrumbTrailRef = useRef<any>(null);
  const boundsRef = useRef<any>(null);

  // Leaflet / OpenStreetMap Refs
  const leafletMapRef = useRef<any>(null);
  const leafletTruckMarkerRef = useRef<any>(null);
  const leafletPolylineRef = useRef<any>(null);
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const [googleMapLoaded, setGoogleMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [authFailure, setAuthFailure] = useState(false);
  const [isFocusedOnTruck, setIsFocusedOnTruck] = useState(false);
  const isFocusedOnTruckRef = useRef(false);

  // Genuine GPS Telemetry State (Never hardcoded or simulated)
  const [liveLocation, setLiveLocation] = useState<{
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    accuracy?: number;
    timestamp: number | string;
  } | null>(null);

  const [trackingStatus, setTrackingStatus] = useState<'LIVE' | 'OFFLINE' | 'UNAVAILABLE'>('UNAVAILABLE');
  const [lastPingTime, setLastPingTime] = useState<string>('');
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const lastUpdateTimestampRef = useRef<number>(0);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Zoom smoothly to Street Level (Zoom 16) on the truck
  const focusOnTruck = () => {
    if (mapEngine === 'osm') {
      if (!leafletMapRef.current || !leafletTruckMarkerRef.current) return;
      const latlng = leafletTruckMarkerRef.current.getLatLng();
      leafletMapRef.current.setView(latlng, 16);
      leafletTruckMarkerRef.current.openPopup();
      setIsFocusedOnTruck(true);
      isFocusedOnTruckRef.current = true;
      return;
    }

    if (!mapInstanceRef.current || !truckMarkerRef.current) return;
    const pos = truckMarkerRef.current.getPosition();
    if (!pos) return;

    mapInstanceRef.current.setCenter(pos);
    mapInstanceRef.current.setZoom(16);

    if (infoWindowRef.current) {
      infoWindowRef.current.open(mapInstanceRef.current, truckMarkerRef.current);
    }
    setIsFocusedOnTruck(true);
    isFocusedOnTruckRef.current = true;
  };

  // Zoom out to view the entire corridor route
  const viewFullRoute = () => {
    if (mapEngine === 'osm') {
      if (!leafletMapRef.current) return;
      const originCoord = CITY_COORDINATES[pickupCity] || { lat: 30.9010, lng: 75.8573 };
      const destCoord = CITY_COORDINATES[deliveryCity] || { lat: 28.7041, lng: 77.1025 };
      const latlng = leafletTruckMarkerRef.current?.getLatLng();
      const points: [number, number][] = [
        [originCoord.lat, originCoord.lng],
        [destCoord.lat, destCoord.lng]
      ];
      if (latlng) points.push([latlng.lat, latlng.lng]);
      leafletMapRef.current.fitBounds(points, { padding: [50, 50] });
      setIsFocusedOnTruck(false);
      isFocusedOnTruckRef.current = false;
      return;
    }

    if (!mapInstanceRef.current || !boundsRef.current) return;

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
    mapInstanceRef.current.fitBounds(boundsRef.current, { top: 50, right: 50, bottom: 50, left: 50 });
    setIsFocusedOnTruck(false);
    isFocusedOnTruckRef.current = false;
  };

  // 1. WebSocket Listener for Genuine GPS Updates
  useEffect(() => {
    if (!bookingId) return;

    const socket = getSocket();
    setAuthErrorMessage(null);

    // Join authorized booking room
    socket.emit('join_trip', { bookingId });

    const onLocationUpdate = (payload: any) => {
      if (payload && typeof payload.latitude === 'number' && typeof payload.longitude === 'number') {
        const isLiveSignal = payload.isLive !== false;
        lastUpdateTimestampRef.current = Date.now();

        setLiveLocation({
          latitude: payload.latitude,
          longitude: payload.longitude,
          speed: Math.max(0, payload.speed || 0),
          heading: payload.heading || 0,
          accuracy: payload.accuracy,
          timestamp: payload.timestamp || Date.now()
        });

        setTrackingStatus(isLiveSignal ? 'LIVE' : 'OFFLINE');
        setLastPingTime(new Date(payload.timestamp || Date.now()).toLocaleTimeString());

        // Update Google Maps Marker if Google Engine is active
        if (truckMarkerRef.current && (window as any).google) {
          const google = (window as any).google;
          const newPos = new google.maps.LatLng(payload.latitude, payload.longitude);

          truckMarkerRef.current.setPosition(newPos);
          truckMarkerRef.current.setVisible(true);

          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div style="font-family: sans-serif; padding: 6px; color: #0F172A; min-width: 200px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <strong style="color: #EA580C; font-size: 14px;">${truckRegistration}</strong>
                  <span style="font-size: 10px; font-weight: bold; background: ${
                    isLiveSignal ? '#DCFCE7; color: #16A34A;' : '#F1F5F9; color: #64748B;'
                  } padding: 2px 7px; border-radius: 999px;">
                    ${isLiveSignal ? 'LIVE GPS' : 'OFFLINE'}
                  </span>
                </div>
                <div style="font-size: 12px; margin-bottom: 3px;">
                  <b>Actual Speed:</b> ${payload.speed || 0} km/h
                </div>
                <div style="font-size: 11px; color: #475569; font-family: monospace; background: #F8FAFC; padding: 4px 6px; border-radius: 6px; border: 1px solid #E2E8F0;">
                  Lat: ${payload.latitude.toFixed(6)}<br/>
                  Lng: ${payload.longitude.toFixed(6)}
                </div>
                <div style="font-size: 10px; color: #94A3B8; margin-top: 5px; border-top: 1px solid #E2E8F0; padding-top: 3px;">
                  Last Fix: ${new Date(payload.timestamp || Date.now()).toLocaleTimeString()}
                </div>
              </div>
            `);
          }

          if (breadcrumbTrailRef.current && isLiveSignal) {
            const path = breadcrumbTrailRef.current.getPath();
            path.push(newPos);
          }

          if (boundsRef.current) {
            boundsRef.current.extend(newPos);
          }

          if (mapInstanceRef.current && isFocusedOnTruckRef.current) {
            mapInstanceRef.current.panTo(newPos);
          }
        }

        // Update Leaflet / OpenStreetMap Marker if OSM Engine is active
        if (leafletTruckMarkerRef.current) {
          const newLatLng: [number, number] = [payload.latitude, payload.longitude];
          leafletTruckMarkerRef.current.setLatLng(newLatLng);

          if (leafletPolylineRef.current && isLiveSignal) {
            leafletPolylineRef.current.addLatLng(newLatLng);
          }

          if (leafletMapRef.current && isFocusedOnTruckRef.current) {
            leafletMapRef.current.panTo(newLatLng);
          }
        }
      }
    };

    const onTrackingStatus = (payload: any) => {
      if (payload && payload.bookingId === bookingId) {
        if (payload.status === 'LIVE' || payload.isLive === true) {
          setTrackingStatus('LIVE');
        } else if (payload.status === 'OFFLINE' || payload.isLive === false) {
          setTrackingStatus('OFFLINE');
        } else {
          setTrackingStatus('UNAVAILABLE');
        }
      }
    };

    const onTripError = (err: any) => {
      if (err?.code === 'UNAUTHORIZED' || err?.message) {
        setAuthErrorMessage(err.message || 'Unauthorized to track this shipment.');
      }
    };

    socket.on('trip:location_update', onLocationUpdate);
    socket.on('trip:tracking_status', onTrackingStatus);
    socket.on('trip:error', onTripError);

    // Watchdog: If no fresh GPS ping in 15 seconds, mark OFFLINE
    const staleInterval = setInterval(() => {
      if (lastUpdateTimestampRef.current > 0) {
        const timeSinceLastPing = Date.now() - lastUpdateTimestampRef.current;
        if (timeSinceLastPing > 15000) {
          setTrackingStatus((prev) => (prev === 'LIVE' ? 'OFFLINE' : prev));
        }
      }
    }, 4000);

    return () => {
      socket.emit('leave_trip', { bookingId });
      socket.off('trip:location_update', onLocationUpdate);
      socket.off('trip:tracking_status', onTrackingStatus);
      socket.off('trip:error', onTripError);
      clearInterval(staleInterval);
    };
  }, [bookingId, truckRegistration]);

  // 2. Load Leaflet CDN Assets for OpenStreetMap
  useEffect(() => {
    if (mapEngine !== 'osm') return;

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
  }, [mapEngine]);

  // 3. Initialize OpenStreetMap (Leaflet)
  useEffect(() => {
    if (mapEngine !== 'osm' || !leafletLoaded || !leafletContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const originCoord = CITY_COORDINATES[pickupCity] || { lat: 30.9010, lng: 75.8573 };
    const destCoord = CITY_COORDINATES[deliveryCity] || { lat: 28.7041, lng: 77.1025 };
    const initialPos: [number, number] = liveLocation
      ? [liveLocation.latitude, liveLocation.longitude]
      : [originCoord.lat, originCoord.lng];

    const map = L.map(leafletContainerRef.current, {
      zoomControl: true
    }).setView(initialPos, 8);
    leafletMapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Origin Marker (Green circle)
    L.circleMarker([originCoord.lat, originCoord.lng], {
      radius: 9,
      color: '#FFFFFF',
      fillColor: '#16A34A',
      fillOpacity: 1,
      weight: 2.5
    }).addTo(map).bindPopup(`<b>Pickup Location:</b> ${pickupCity}`);

    // Destination Marker (Orange circle)
    L.circleMarker([destCoord.lat, destCoord.lng], {
      radius: 9,
      color: '#FFFFFF',
      fillColor: '#F97316',
      fillOpacity: 1,
      weight: 2.5
    }).addTo(map).bindPopup(`<b>Destination:</b> ${deliveryCity}`);

    // Route corridor line
    L.polyline(
      [[originCoord.lat, originCoord.lng], [destCoord.lat, destCoord.lng]],
      {
        color: '#94A3B8',
        weight: 4,
        opacity: 0.6,
        dashArray: '6, 8'
      }
    ).addTo(map);

    // Live Breadcrumb line
    const breadcrumb = L.polyline([initialPos], {
      color: '#EA580C',
      weight: 4,
      opacity: 0.9
    }).addTo(map);
    leafletPolylineRef.current = breadcrumb;

    // Custom Truck Pin Icon
    const truckIcon = L.divIcon({
      className: 'custom-truck-pin',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
          <div style="background: #EA580C; color: white; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 999px; box-shadow: 0 4px 8px rgba(0,0,0,0.35); border: 2px solid white; white-space: nowrap; margin-bottom: 2px;">
            🚚 ${truckRegistration}
          </div>
          <div style="width: 14px; height: 14px; background: #DC2626; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>
        </div>
      `,
      iconSize: [0, 0]
    });

    const marker = L.marker(initialPos, { icon: truckIcon }).addTo(map);
    leafletTruckMarkerRef.current = marker;

    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px; min-width: 190px;">
        <div style="font-weight: bold; color: #EA580C; font-size: 13px;">${truckRegistration}</div>
        <div style="font-size: 11px; margin-top: 3px;">Speed: <b>${liveLocation ? liveLocation.speed : 0} km/h</b></div>
        <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Status: <b>${trackingStatus}</b></div>
        <div style="font-size: 9px; color: #94A3B8; margin-top: 4px; border-top: 1px solid #E2E8F0; padding-top: 3px;">
          Zoom: Street Level (16x)
        </div>
      </div>
    `;
    marker.bindPopup(popupContent);

    // CLICK TRUCK PIN -> Zoom in to exact Street Level 16!
    marker.on('click', () => {
      const latlng = marker.getLatLng();
      map.setView(latlng, 16);
      marker.openPopup();
      setIsFocusedOnTruck(true);
      isFocusedOnTruckRef.current = true;
    });

    map.on('dragstart', () => {
      setIsFocusedOnTruck(false);
      isFocusedOnTruckRef.current = false;
    });

    const bounds = L.latLngBounds([
      [originCoord.lat, originCoord.lng],
      [destCoord.lat, destCoord.lng],
      initialPos
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapEngine, leafletLoaded, pickupCity, deliveryCity]);

  // 4. Load Google Maps Script
  useEffect(() => {
    if (mapEngine !== 'google') return;

    (window as any).gm_authFailure = () => {
      console.warn('[Google Maps] RefererNotAllowedMapError or Quota limit detected.');
      setAuthFailure(true);
      setQuotaExceededNotice(true);
      setMapEngine('osm'); // Auto-fallback to OpenStreetMap
    };

    if (!apiKey) {
      setMapError('Google Maps API key is not configured in client environment.');
      setMapEngine('osm');
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const onScriptLoaded = () => {
      setGoogleMapLoaded(true);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = onScriptLoaded;
      script.onerror = () => {
        setQuotaExceededNotice(true);
        setMapEngine('osm'); // Auto-fallback to OpenStreetMap
      };
      document.head.appendChild(script);
    } else if ((window as any).google && (window as any).google.maps) {
      setGoogleMapLoaded(true);
    } else {
      script.addEventListener('load', onScriptLoaded);
    }
  }, [mapEngine, apiKey]);

  // 5. Initialize Google Maps
  useEffect(() => {
    if (mapEngine !== 'google' || authFailure || !googleMapLoaded || !googleMapRef.current || !(window as any).google) return;

    try {
      const google = (window as any).google;

      const originCoord = CITY_COORDINATES[pickupCity] || { lat: 30.9010, lng: 75.8573 };
      const destCoord = CITY_COORDINATES[deliveryCity] || { lat: 28.7041, lng: 77.1025 };

      const centerLat = (originCoord.lat + destCoord.lat) / 2;
      const centerLng = (originCoord.lng + destCoord.lng) / 2;

      const map = new google.maps.Map(googleMapRef.current, {
        zoom: 7,
        center: { lat: centerLat, lng: centerLng },
        mapTypeId: 'roadmap',
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
        ]
      });
      mapInstanceRef.current = map;

      // Marker 1: Pickup Location (Green Circle)
      new google.maps.Marker({
        position: originCoord,
        map,
        title: `Pickup Location: ${pickupCity}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#16A34A',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5
        }
      });

      // Marker 2: Destination Location (Orange Circle)
      new google.maps.Marker({
        position: destCoord,
        map,
        title: `Delivery Destination: ${deliveryCity}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#F97316',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5
        }
      });

      // Highway Route Corridor Line
      new google.maps.Polyline({
        path: [originCoord, destCoord],
        geodesic: true,
        strokeColor: '#94A3B8',
        strokeOpacity: 0.5,
        strokeWeight: 4,
        map
      });

      // Breadcrumb trail
      const breadcrumbTrail = new google.maps.Polyline({
        path: liveLocation ? [new google.maps.LatLng(liveLocation.latitude, liveLocation.longitude)] : [],
        geodesic: true,
        strokeColor: '#F97316',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map
      });
      breadcrumbTrailRef.current = breadcrumbTrail;

      // Initial Truck Marker position
      const initialPos = liveLocation
        ? { lat: liveLocation.latitude, lng: liveLocation.longitude }
        : originCoord;

      const truckMarker = new google.maps.Marker({
        position: initialPos,
        map,
        title: `${truckRegistration} - Click to Zoom into Exact Street Location`,
        label: {
          text: '🚚',
          fontSize: '24px'
        }
      });
      truckMarkerRef.current = truckMarker;

      const infoWindow = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(0, -25),
        content: `
          <div style="font-family: sans-serif; padding: 6px; color: #0F172A; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <strong style="color: #EA580C; font-size: 14px;">${truckRegistration}</strong>
              <span style="font-size: 10px; font-weight: bold; background: ${
                trackingStatus === 'LIVE' ? '#DCFCE7; color: #16A34A;' : '#F1F5F9; color: #64748B;'
              } padding: 2px 7px; border-radius: 999px;">
                ${trackingStatus === 'LIVE' ? 'LIVE GPS' : 'OFFLINE'}
              </span>
            </div>
            <div style="font-size: 12px; margin-bottom: 3px;">
              <b>Actual Speed:</b> ${liveLocation ? `${liveLocation.speed} km/h` : '0 km/h'}
            </div>
            <div style="font-size: 11px; color: #475569; font-family: monospace; background: #F8FAFC; padding: 4px 6px; border-radius: 6px; border: 1px solid #E2E8F0;">
              Lat: ${initialPos.lat.toFixed(6)}<br/>
              Lng: ${initialPos.lng.toFixed(6)}
            </div>
            <div style="font-size: 10px; color: #94A3B8; margin-top: 5px; border-top: 1px solid #E2E8F0; padding-top: 3px;">
              Street View Zoom: 16x Active
            </div>
          </div>
        `
      });
      infoWindowRef.current = infoWindow;

      truckMarker.addListener('click', () => {
        const pos = truckMarker.getPosition();
        if (pos) {
          map.setCenter(pos);
          map.setZoom(16);
          infoWindow.open(map, truckMarker);
          setIsFocusedOnTruck(true);
          isFocusedOnTruckRef.current = true;
        }
      });

      map.addListener('dragstart', () => {
        setIsFocusedOnTruck(false);
        isFocusedOnTruckRef.current = false;
      });

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(originCoord);
      bounds.extend(destCoord);
      if (liveLocation) {
        bounds.extend({ lat: liveLocation.latitude, lng: liveLocation.longitude });
      }
      boundsRef.current = bounds;
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } catch (err: any) {
      setMapError('Error initializing Google Maps: ' + err.message);
      setMapEngine('osm');
    }
  }, [mapEngine, googleMapLoaded, pickupCity, deliveryCity, authFailure]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
      {/* Top Floating Status Bar */}
      <div className="p-3.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white text-xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Indicator */}
        <div className="flex items-center space-x-2.5">
          {trackingStatus === 'LIVE' ? (
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              <span>LIVE GPS TRACKING</span>
            </div>
          ) : trackingStatus === 'OFFLINE' ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>OFFLINE {lastPingTime && `(Last seen ${lastPingTime})`}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 font-semibold">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>LOCATION UNAVAILABLE</span>
            </div>
          )}

          <span className="text-slate-600">|</span>
          <span className="text-brand-orange font-mono font-black">{truckRegistration}</span>
        </div>

        {/* Action Controls & Live Metrics */}
        <div className="flex items-center space-x-2.5 text-[11px] text-slate-300">
          {trackingStatus === 'LIVE' && liveLocation && (
            <div className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 font-mono font-bold flex items-center space-x-1">
              <Zap className="w-3 h-3 text-green-400" />
              <span>{liveLocation.speed} km/h</span>
            </div>
          )}

          {/* Map Engine Selector (OSM vs Google Maps) */}
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setMapEngine('osm')}
              title="OpenStreetMap: 100% Free, Unlimited Quota"
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                mapEngine === 'osm'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>OpenStreetMap</span>
            </button>

            <button
              type="button"
              onClick={() => setMapEngine('google')}
              title="Google Maps: Requires Active Daily Quota"
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                mapEngine === 'google'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Google Maps</span>
            </button>
          </div>

          {/* Quick Zoom Actions */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={focusOnTruck}
              title="Zoom into exact truck street location"
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                isFocusedOnTruck
                  ? 'bg-brand-orange text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Focus Truck</span>
            </button>

            <button
              type="button"
              onClick={viewFullRoute}
              title="Zoom out to view full corridor route"
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                !isFocusedOnTruck
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Route</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quota Exceeded Friendly Banner */}
      {quotaExceededNotice && mapEngine === 'osm' && (
        <div className="p-2.5 bg-blue-950/60 border-b border-blue-800/60 text-blue-200 text-xs flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Google Maps Demo daily quota reached for this key. Switched to <b>OpenStreetMap</b> for 100% free, uninterrupted live GPS tracking.
            </span>
          </div>
          <a
            href="https://console.cloud.google.com/google/maps-apis/quotas"
            target="_blank"
            rel="noreferrer"
            className="text-blue-300 underline font-semibold text-[11px] ml-2 shrink-0 hover:text-white"
          >
            Upgrade Google Limits ↗
          </a>
        </div>
      )}

      {/* Unauthorized Alert if unauthorized user attempts to view */}
      {authErrorMessage && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{authErrorMessage}</span>
        </div>
      )}

      {/* Sub-status notice when GPS is unavailable */}
      {trackingStatus === 'UNAVAILABLE' && (
        <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <span>Transporter has not started device GPS transmission for this trip yet.</span>
          <span className="text-slate-500 font-mono">Status: Standby</span>
        </div>
      )}

      {/* Map Views Container */}
      <div className="w-full h-80 relative">
        {/* OpenStreetMap Container */}
        <div
          ref={leafletContainerRef}
          className={`w-full h-full transition-opacity duration-300 ${
            mapEngine === 'osm' ? 'block' : 'hidden'
          }`}
        />

        {/* Google Maps Container */}
        <div
          ref={googleMapRef}
          className={`w-full h-full transition-opacity duration-300 ${
            mapEngine === 'google' ? 'block' : 'hidden'
          }`}
        />
      </div>
    </div>
  );
};
