import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/authContext';
import {
  Package,
  MapPin,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Truck,
  X,
  Mic,
  Sparkles
} from 'lucide-react';
import { CargoType, UserRole } from '@loadvanta/contracts';
import { VoiceLoadSearchModal } from '../components/voice/VoiceLoadSearchModal';

export const FindLoadsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickupFilter, setPickupFilter] = useState(searchParams.get('pickupCity') || '');
  const [deliveryFilter, setDeliveryFilter] = useState(searchParams.get('deliveryCity') || '');
  const [cargoFilter, setCargoFilter] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  useEffect(() => {
    const qPickup = searchParams.get('pickupCity');
    const qDelivery = searchParams.get('deliveryCity');
    if (qPickup !== null) setPickupFilter(qPickup);
    if (qDelivery !== null) setDeliveryFilter(qDelivery);
  }, [searchParams]);

  // Quotation Submission Modal
  const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
  const [myVehicles, setMyVehicles] = useState<any[]>([]);
  const [quoteData, setQuoteData] = useState({
    vehicleId: '',
    proposedPriceInr: '',
    estimatedPickupDate: '',
    estimatedDeliveryDate: '',
    comments: ''
  });
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (pickupFilter) params.set('pickupCity', pickupFilter);
      if (deliveryFilter) params.set('deliveryCity', deliveryFilter);
      if (cargoFilter) params.set('cargoType', cargoFilter);

      const res = await api.get(`/shipments?${params.toString()}`);
      if (res.data.success) {
        setShipments(res.data.data.items || []);
      }
    } catch {
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [pickupFilter, deliveryFilter, cargoFilter]);

  // If user is transporter, load their vehicles for quotation submission
  useEffect(() => {
    if (user && user.role === UserRole.TRANSPORTER) {
      api.get('/vehicles/my-fleet').then((res) => {
        if (res.data.success) {
          setMyVehicles(res.data.data || []);
          if (res.data.data.length > 0) {
            setQuoteData((prev) => ({ ...prev, vehicleId: res.data.data[0]._id }));
          }
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleOpenQuoteModal = (load: any) => {
    setSelectedLoad(load);
    setQuoteSuccess(false);
    setQuoteError('');
    setQuoteData({
      vehicleId: myVehicles.length > 0 ? myVehicles[0]._id : '',
      proposedPriceInr: load.targetPriceInr ? String(load.targetPriceInr) : '',
      estimatedPickupDate: load.pickupDate ? new Date(load.pickupDate).toISOString().split('T')[0] : '',
      estimatedDeliveryDate: load.deliveryDeadline ? new Date(load.deliveryDeadline).toISOString().split('T')[0] : '',
      comments: ''
    });
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoad) return;
    setQuoteSubmitting(true);
    setQuoteError('');

    try {
      const res = await api.post('/quotations', {
        shipmentId: selectedLoad._id,
        vehicleId: quoteData.vehicleId,
        proposedPriceInr: parseFloat(quoteData.proposedPriceInr),
        estimatedPickupDate: new Date(quoteData.estimatedPickupDate),
        estimatedDeliveryDate: new Date(quoteData.estimatedDeliveryDate),
        comments: quoteData.comments
      });

      if (res.data.success) {
        setQuoteSuccess(true);
      }
    } catch (err: any) {
      setQuoteError(err.message || 'Failed to submit quotation');
    } finally {
      setQuoteSubmitting(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight">
            Available Loads & Freight in Punjab
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore published shipments ready for quotation and direct dispatch.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsVoiceModalOpen(true)}
          className="inline-flex items-center space-x-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orangeHover hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-brand-orange/25 hover:shadow-xl hover:scale-[1.02] transition-all self-start sm:self-auto cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-amber-100 font-bold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-200" />
              <span>Gemini AI Voice</span>
            </div>
            <div className="text-sm font-black">ਬੋਲ ਕੇ ਲੱਭੋ • Voice Search</div>
          </div>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Pickup City</label>
          <select
            value={pickupFilter}
            onChange={(e) => setPickupFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">All Origins</option>
            {punjabCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Delivery Destination</label>
          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">All Destinations</option>
            {punjabCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Cargo Category</label>
          <select
            value={cargoFilter}
            onChange={(e) => setCargoFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">All Cargo Categories</option>
            <option value={CargoType.TEXTILES_GARMENTS}>Textiles & Yarn (Ludhiana)</option>
            <option value={CargoType.AGRICULTURAL_GRAINS}>Grains & Agro Produce</option>
            <option value={CargoType.INDUSTRIAL_AUTO_PARTS}>Industrial & Auto Parts</option>
            <option value={CargoType.CONSTRUCTION_STEEL}>Steel & Metals (Mandi Gobindgarh)</option>
            <option value={CargoType.SPORTS_GOODS}>Sports Goods (Jalandhar)</option>
          </select>
        </div>

        <div>
          <button
            onClick={() => {
              setPickupFilter('');
              setDeliveryFilter('');
              setCargoFilter('');
            }}
            className="w-full py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Shipment Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No published loads found</h3>
          <p className="text-xs text-slate-500 mt-1">Check back shortly or reset your corridor filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shipments.map((s) => (
            <div
              key={s._id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:border-brand-orange transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full uppercase">
                    {s.cargoType?.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-extrabold text-brand-orange">
                    {s.targetPriceInr ? `₹${s.targetPriceInr.toLocaleString('en-IN')}` : 'Open RFQ'}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                  {s.title}
                </h3>

                {/* Route visualization */}
                <div className="my-4 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></span>
                    <span className="text-slate-500">From:</span>
                    <strong className="text-slate-800 dark:text-white">{s.pickupCity}</strong>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-orange shrink-0"></span>
                    <span className="text-slate-500">To:</span>
                    <strong className="text-slate-800 dark:text-white">{s.deliveryCity}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Cargo Weight:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{s.weightTons} Tons</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Required Truck:</span>
                    <span className="font-semibold">{s.requiredVehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pickup Date:</span>
                    <span className="font-semibold">{new Date(s.pickupDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                {user?.role === UserRole.TRANSPORTER ? (
                  <button
                    onClick={() => handleOpenQuoteModal(s)}
                    className="w-full py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Quotation</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="w-full py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors block text-center"
                  >
                    <span>Sign in as Transporter to Quote</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quotation Submission Modal */}
      {selectedLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <button
              onClick={() => setSelectedLoad(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Submit Quotation for Load
            </h3>
            <p className="text-xs text-slate-500 mb-4 line-clamp-1">{selectedLoad.title}</p>

            {quoteSuccess ? (
              <div className="p-6 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <div className="font-bold text-sm">Quotation Submitted Successfully!</div>
                <p className="text-xs">
                  The shipper has been notified and can review and accept your quotation in their dashboard.
                </p>
                <button
                  onClick={() => setSelectedLoad(null)}
                  className="px-6 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="space-y-4">
                {quoteError && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                    {quoteError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Select Your Vehicle *
                  </label>
                  {myVehicles.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-xs">
                      No registered vehicles in your fleet. Please add a truck in your dashboard first.
                    </div>
                  ) : (
                    <select
                      required
                      value={quoteData.vehicleId}
                      onChange={(e) => setQuoteData({ ...quoteData, vehicleId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    >
                      {myVehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} — {v.capacityTons}T ({v.bodyType}) in {v.currentCity}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Proposed Freight Rate (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={quoteData.proposedPriceInr}
                    onChange={(e) => setQuoteData({ ...quoteData, proposedPriceInr: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold"
                    placeholder="e.g. 18500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Estimated Pickup *
                    </label>
                    <input
                      type="date"
                      required
                      value={quoteData.estimatedPickupDate}
                      onChange={(e) => setQuoteData({ ...quoteData, estimatedPickupDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Estimated Delivery *
                    </label>
                    <input
                      type="date"
                      required
                      value={quoteData.estimatedDeliveryDate}
                      onChange={(e) => setQuoteData({ ...quoteData, estimatedDeliveryDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Comments & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={quoteData.comments}
                    onChange={(e) => setQuoteData({ ...quoteData, comments: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    placeholder="e.g. Container truck stationed near bypass, ready for loading"
                  />
                </div>

                <button
                  type="submit"
                  disabled={quoteSubmitting || myVehicles.length === 0}
                  className="w-full py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{quoteSubmitting ? 'Submitting...' : 'Send Quotation to Shipper'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Gemini AI Punjabi/Hindi Voice Search Modal */}
      <VoiceLoadSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyFilters={(filters) => {
          if (filters.pickupCity) setPickupFilter(filters.pickupCity);
          if (filters.deliveryCity) setDeliveryFilter(filters.deliveryCity);
          if (filters.cargoType) setCargoFilter(filters.cargoType);
        }}
      />
    </div>
  );
};
