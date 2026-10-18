import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Truck,
  ShieldCheck,
  MapPin,
  Filter,
  Phone,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import { VehicleType, VerificationStatus } from '@loadvanta/contracts';

export const FindTrucksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('vehicleType') || '');
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cityFilter) params.set('city', cityFilter);
      if (typeFilter) params.set('vehicleType', typeFilter);
      params.set('isAvailable', 'true');

      const res = await api.get(`/vehicles?${params.toString()}`);
      if (res.data.success) {
        setVehicles(res.data.data.items || []);
      }
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [cityFilter, typeFilter]);

  const punjabCities = [
    'Ludhiana',
    'Jalandhar',
    'Amritsar',
    'Bathinda',
    'Patiala',
    'Mohali',
    'Chandigarh',
    'Mandi Gobindgarh',
    'Khanna',
    'Delhi'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Breadcrumbs */}
      <div>
        <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight">
          Find Available Trucks in Punjab
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Discover verified commercial vehicles, containers, and trailers ready for dispatch.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Current City / Hub</label>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">All Punjab & North Cities</option>
            {punjabCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Vehicle Category</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">All Vehicle Types</option>
            <option value={VehicleType.LIGHT_COMMERCIAL}>Light Commercial (3.5 - 7T)</option>
            <option value={VehicleType.MEDIUM_DUTY}>Medium Duty (9 - 12T)</option>
            <option value={VehicleType.HEAVY_DUTY}>Heavy Duty (16 - 25T)</option>
            <option value={VehicleType.MULTI_AXLE_TRAILER}>Multi-Axle Trailer (30 - 45T)</option>
          </select>
        </div>

        <div className="w-full md:w-auto self-end">
          <button
            onClick={() => {
              setCityFilter('');
              setTypeFilter('');
            }}
            className="w-full px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Truck Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No trucks found matching criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different city or clearing your category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div
              key={v._id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:border-brand-orange transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-800 dark:text-white">
                      {v.registrationNumber}
                    </span>
                    {v.verificationStatus === VerificationStatus.VERIFIED && (
                      <span className="flex items-center space-x-1 text-[11px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-brand-orange bg-orange-50 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                    {v.capacityTons} Tons Payload
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {v.bodyType || 'Commercial Freight Carrier'}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Location: <strong className="text-slate-800 dark:text-white">{v.currentCity}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Type: <strong>{v.vehicleType}</strong></span>
                  </div>
                  {v.transporterId?.companyName && (
                    <div className="flex items-center space-x-2 text-slate-500">
                      <span>Operator: <strong>{v.transporterId.companyName}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-green-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready for Dispatch</span>
                </span>
                <button
                  onClick={() => setSelectedVehicle(v)}
                  className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                >
                  Contact Operator
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Operator Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <button
              onClick={() => setSelectedVehicle(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Vehicle Booking Request
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Direct connection with verified fleet operator
            </p>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 space-y-2 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Registration:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">
                  {selectedVehicle.registrationNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payload Capacity:</span>
                <span className="font-bold text-brand-orange">{selectedVehicle.capacityTons} Tons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Depot:</span>
                <span className="font-semibold">{selectedVehicle.currentCity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transporter:</span>
                <span className="font-semibold">{selectedVehicle.transporterId?.fullName || 'Dhillon Malwa'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-brand-orange">{selectedVehicle.transporterId?.phone || '+91 98150 98765'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to="/register"
                className="w-full py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-center font-semibold text-sm block"
              >
                Sign In / Register as Shipper to Book
              </Link>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="w-full py-2 rounded-xl text-slate-500 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
