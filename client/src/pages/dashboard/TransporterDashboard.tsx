import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import {
  Truck,
  Plus,
  RefreshCw,
  Send,
  MapPin,
  CheckCircle2,
  Calendar,
  AlertCircle,
  X,
  FileCheck,
  TrendingUp,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import {
  VehicleType,
  CargoType,
  MilestoneType,
  QuotationStatus,
  BookingStatus
} from '@loadvanta/contracts';
import { LiveTripMap } from '../../components/maps/LiveTripMap';
import { DriverGpsController } from '../../components/tracking/DriverGpsController';

export const TransporterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'fleet' | 'matching' | 'quotations' | 'trips'>('fleet');

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Return Load Matching Engine State
  const [selectedVehicleForMatch, setSelectedVehicleForMatch] = useState<string>('');
  const [matchedLoads, setMatchedLoads] = useState<any[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Add Vehicle Modal
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: '',
    vehicleType: VehicleType.HEAVY_DUTY,
    bodyType: 'Container 28ft',
    capacityTons: 16,
    currentCity: 'Ludhiana',
    supportedCargoTypes: [CargoType.TEXTILES_GARMENTS, CargoType.GENERAL_MERCHANDISE]
  });
  const [addVehicleLoading, setAddVehicleLoading] = useState(false);
  const [addVehicleError, setAddVehicleError] = useState('');

  // Milestone Update Modal
  const [milestoneBooking, setMilestoneBooking] = useState<any | null>(null);
  const [milestoneType, setMilestoneType] = useState<MilestoneType>(MilestoneType.TRUCK_DISPATCHED);
  const [milestoneLocation, setMilestoneLocation] = useState('');
  const [milestoneNotes, setMilestoneNotes] = useState('');

  // Quick Quote Modal from Match
  const [quoteShipment, setQuoteShipment] = useState<any | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  // POD Upload Modal State
  const [podModalBooking, setPodModalBooking] = useState<any | null>(null);
  const [podReceiverName, setPodReceiverName] = useState('');
  const [podNotes, setPodNotes] = useState('');
  const [podLoading, setPodLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, qRes, bRes] = await Promise.all([
        api.get('/vehicles/my-fleet'),
        api.get('/quotations/my-quotations'),
        api.get('/bookings')
      ]);

      if (vRes.data.success) {
        setVehicles(vRes.data.data || []);
        if (vRes.data.data.length > 0 && !selectedVehicleForMatch) {
          setSelectedVehicleForMatch(vRes.data.data[0]._id);
        }
      }
      if (qRes.data.success) {
        setQuotations(qRes.data.data || []);
      }
      if (bRes.data.success) {
        setBookings(bRes.data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch Return Load Matches
  const runMatching = async (vehicleId: string) => {
    if (!vehicleId) return;
    setMatchingLoading(true);
    try {
      const res = await api.get(`/matches/vehicle/${vehicleId}?homeCity=${user?.city || 'Ludhiana'}`);
      if (res.data.success) {
        setMatchedLoads(res.data.data || []);
      }
    } catch {
      setMatchedLoads([]);
    } finally {
      setMatchingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'matching' && selectedVehicleForMatch) {
      runMatching(selectedVehicleForMatch);
    }
  }, [activeTab, selectedVehicleForMatch]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddVehicleLoading(true);
    setAddVehicleError('');

    try {
      const res = await api.post('/vehicles', {
        ...newVehicle,
        capacityTons: Number(newVehicle.capacityTons)
      });
      if (res.data.success) {
        setAddVehicleOpen(false);
        loadData();
      }
    } catch (err: any) {
      setAddVehicleError(err.message || 'Failed to add vehicle');
    } finally {
      setAddVehicleLoading(false);
    }
  };

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneBooking) return;

    try {
      const res = await api.post(`/bookings/${milestoneBooking._id}/milestones`, {
        type: milestoneType,
        title: milestoneType.replace(/_/g, ' '),
        location: milestoneLocation,
        description: milestoneNotes
      });

      if (res.data.success) {
        setMilestoneBooking(null);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update milestone');
    }
  };

  const handleQuickQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteShipment) return;
    setQuoteSubmitting(true);

    try {
      const res = await api.post('/quotations', {
        shipmentId: quoteShipment._id,
        vehicleId: selectedVehicleForMatch,
        proposedPriceInr: Number(quotePrice),
        estimatedPickupDate: quoteShipment.pickupDate,
        estimatedDeliveryDate: quoteShipment.deliveryDeadline,
        comments: 'Quote generated via Return-Load Matching Engine'
      });

      if (res.data.success) {
        setQuoteShipment(null);
        loadData();
        setActiveTab('quotations');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit quote');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const handleUploadPod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podModalBooking) return;
    setPodLoading(true);

    try {
      const res = await api.post(`/bookings/${podModalBooking._id}/delivery-proof`, {
        documentUrl: `https://loadvanta.com/pod-signed/${podModalBooking.bookingNumber}.pdf`,
        receiverName: podReceiverName || 'Warehouse Consignee Manager',
        notes: podNotes || 'Goods received in sound condition. Seal verified intact.'
      });

      if (res.data.success) {
        setPodModalBooking(null);
        setPodReceiverName('');
        setPodNotes('');
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload POD');
    } finally {
      setPodLoading(false);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight">
            Transporter Fleet Terminal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fleet: <strong>{user?.companyName || user?.fullName}</strong> — Base: {user?.city}
          </p>
        </div>

        <button
          onClick={() => setAddVehicleOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-semibold flex items-center space-x-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Commercial Vehicle</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Fleet Vehicles</div>
          <div className="text-2xl font-black text-brand-navy dark:text-white mt-1">{vehicles.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Active Journeys</div>
          <div className="text-2xl font-black text-brand-orange mt-1">
            {bookings.filter((b) => b.status === BookingStatus.IN_TRANSIT).length}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Submitted Quotes</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{quotations.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Gross Bookings</div>
          <div className="text-2xl font-black text-green-600 mt-1">
            ₹{bookings.reduce((sum, b) => sum + (b.agreedPriceInr || 0), 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'fleet' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Fleet ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('matching')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap flex items-center space-x-1.5 transition-all ${
            activeTab === 'matching' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Return-Load Matching</span>
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'quotations' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Quotes ({quotations.length})
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'trips' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Trips & Milestones ({bookings.length})
        </button>
      </div>

      {/* Tab 1: Fleet */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {vehicles.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-sm">No vehicles added yet</div>
              <p className="text-xs text-slate-500 mt-1">Add your commercial trucks to find loads and return cargo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <div
                  key={v._id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono text-sm font-bold bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                        {v.registrationNumber}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        v.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {v.isAvailable ? 'Available' : 'Booked'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{v.bodyType}</h3>
                    <div className="text-xs text-brand-orange font-bold mt-0.5">{v.capacityTons} Tons Payload</div>

                    <div className="mt-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl space-y-1 text-xs">
                      <div>Current Location: <strong>{v.currentCity}</strong></div>
                      <div>Type: <strong>{v.vehicleType}</strong></div>
                      <div>Verification: <strong className="text-green-600">{v.verificationStatus}</strong></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setSelectedVehicleForMatch(v._id);
                        setActiveTab('matching');
                      }}
                      className="w-full py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-orange text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Find Return Loads for this Truck</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Smart Return Loads Matching Engine */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-brand-orange flex items-center space-x-1">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Return-Load Matching Engine</span>
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Select Vehicle to Compute Return Corridors
              </h3>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <select
                value={selectedVehicleForMatch}
                onChange={(e) => setSelectedVehicleForMatch(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold"
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber} ({v.currentCity} - {v.capacityTons}T)
                  </option>
                ))}
              </select>
              <button
                onClick={() => runMatching(selectedVehicleForMatch)}
                className="px-4 py-2 rounded-xl bg-brand-orange text-white text-xs font-bold"
              >
                Scan Now
              </button>
            </div>
          </div>

          {matchingLoading ? (
            <div className="text-center py-16 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-orange" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Evaluating Highway Corridors & Return Loads...
              </div>
            </div>
          ) : matchedLoads.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-sm">No return load matches meeting score threshold</div>
              <p className="text-xs text-slate-500 mt-1">We will notify you immediately when a matching return consignment is posted.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matchedLoads.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-orange-200 dark:border-slate-700 p-6 shadow-md flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-brand-orange uppercase">
                        {m.shipment?.cargoType?.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-green-100 text-green-700">
                        {m.score}% Match Score
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                      {m.shipment?.title}
                    </h3>

                    {/* Score Breakdown Pills */}
                    <div className="grid grid-cols-3 gap-2 my-3 text-[11px] font-semibold text-center">
                      <div className="p-2 bg-orange-50 dark:bg-slate-900 rounded-xl">
                        <div className="text-brand-orange">{m.breakdown.routeCompatibilityScore} / 35</div>
                        <span className="text-[10px] text-slate-400">Route Match</span>
                      </div>
                      <div className="p-2 bg-blue-50 dark:bg-slate-900 rounded-xl">
                        <div className="text-blue-600">{m.breakdown.timingCompatibilityScore} / 25</div>
                        <span className="text-[10px] text-slate-400">Timing Window</span>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-slate-900 rounded-xl">
                        <div className="text-green-600">{m.breakdown.capacityCompatibilityScore} / 20</div>
                        <span className="text-[10px] text-slate-400">Payload Fit</span>
                      </div>
                    </div>

                    {/* Route specs */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs space-y-1">
                      <div>Return Route: <strong>{m.shipment?.pickupCity} → {m.shipment?.deliveryCity} ({m.breakdown.roadDistanceKm} km)</strong></div>
                      <div>Detour Deadhead: <strong className="text-green-600">{m.breakdown.detourDistanceKm} km</strong></div>
                      <div>Cargo Weight: <strong>{m.shipment?.weightTons} Tons</strong></div>
                    </div>

                    {/* Explanations */}
                    <div className="mt-3 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Engine Analysis:</span>
                      {m.breakdown.explanations.slice(0, 3).map((exp: string, i: number) => (
                        <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <span>{exp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setQuoteShipment(m.shipment);
                        setQuotePrice(m.shipment?.targetPriceInr ? String(m.shipment.targetPriceInr) : '15000');
                      }}
                      className="w-full py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold transition-colors flex items-center justify-center space-x-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Quote for this Return Load</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Quotations */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          {quotations.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-sm">No quotations submitted yet</div>
              <p className="text-xs text-slate-500 mt-1">Browse available loads or matching return cargo to submit bids.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quotations.map((q) => (
                <div
                  key={q._id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      q.status === 'ACCEPTED'
                        ? 'bg-green-100 text-green-700'
                        : q.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {q.status}
                    </span>
                    <div className="text-lg font-black text-brand-orange">
                      ₹{q.proposedPriceInr?.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {q.shipmentId?.title}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1">
                      Corridor: {q.shipmentId?.pickupCity} → {q.shipmentId?.deliveryCity}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Assigned Truck: {q.vehicleId?.registrationNumber}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Active Trips & Milestones */}
      {activeTab === 'trips' && (
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-sm">No confirmed trips yet</div>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((b) => (
                <div
                  key={b._id}
                  className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div>
                      <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {b.bookingNumber}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                        {b.shipmentId?.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-black text-brand-orange">
                        ₹{b.agreedPriceInr?.toLocaleString('en-IN')}
                      </span>
                      {b.status !== 'COMPLETED' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setMilestoneBooking(b);
                              setMilestoneLocation(b.shipmentId?.pickupCity || '');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-semibold"
                          >
                            Update Milestone
                          </button>
                          <button
                            onClick={() => {
                              setPodModalBooking(b);
                              setPodReceiverName('');
                              setPodNotes('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex items-center space-x-1"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Upload POD</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Route: <strong>{b.shipmentId?.pickupCity} → {b.shipmentId?.deliveryCity}</strong></div>
                    <div>Vehicle: <strong>{b.vehicleId?.registrationNumber}</strong></div>
                    <div>Latest Status: <strong className="text-green-600">{b.status}</strong></div>
                  </div>

                  <LiveTripMap
                    bookingId={b._id}
                    pickupCity={b.shipmentId?.pickupCity || 'Bathinda'}
                    deliveryCity={b.shipmentId?.deliveryCity || 'Delhi'}
                    currentMilestoneLocation={b.milestones?.[b.milestones.length - 1]?.location}
                    truckRegistration={b.vehicleId?.registrationNumber}
                    status={b.status}
                  />

                  {/* Real-Time Driver GPS Broadcasting Panel (Active during trip) */}
                  {b.status !== 'COMPLETED' && (
                    <div className="pt-2">
                      <DriverGpsController
                        bookingId={b._id}
                        vehicleId={b.vehicleId?._id || b.vehicleId}
                        truckRegistration={b.vehicleId?.registrationNumber}
                        pickupCity={b.shipmentId?.pickupCity || 'Bathinda'}
                        deliveryCity={b.shipmentId?.deliveryCity || 'Delhi'}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {addVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Fleet Vehicle</h3>
              <button onClick={() => setAddVehicleOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addVehicleError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                {addVehicleError}
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.registrationNumber}
                  onChange={(e) => setNewVehicle({ ...newVehicle, registrationNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-mono uppercase"
                  placeholder="e.g. PB10CZ4521"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    value={newVehicle.vehicleType}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value={VehicleType.LIGHT_COMMERCIAL}>Light Commercial</option>
                    <option value={VehicleType.MEDIUM_DUTY}>Medium Duty (6-W)</option>
                    <option value={VehicleType.HEAVY_DUTY}>Heavy Duty (10/12-W)</option>
                    <option value={VehicleType.MULTI_AXLE_TRAILER}>Multi-Axle Trailer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Payload (Tons) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={newVehicle.capacityTons}
                    onChange={(e) => setNewVehicle({ ...newVehicle, capacityTons: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Current Location / Base City *
                </label>
                <select
                  value={newVehicle.currentCity}
                  onChange={(e) => setNewVehicle({ ...newVehicle, currentCity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                >
                  {punjabCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Body Type Specification
                </label>
                <input
                  type="text"
                  value={newVehicle.bodyType}
                  onChange={(e) => setNewVehicle({ ...newVehicle, bodyType: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                  placeholder="e.g. 28ft Closed Container"
                />
              </div>

              <button
                type="submit"
                disabled={addVehicleLoading}
                className="w-full py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold shadow-sm transition-colors mt-2"
              >
                {addVehicleLoading ? 'Registering...' : 'Register Vehicle to Fleet'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Update Modal */}
      {milestoneBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Update Trip Milestone</h3>
              <button onClick={() => setMilestoneBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMilestone} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Milestone Stage *</label>
                <select
                  value={milestoneType}
                  onChange={(e) => setMilestoneType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                >
                  <option value={MilestoneType.TRUCK_DISPATCHED}>Truck Dispatched</option>
                  <option value={MilestoneType.ARRIVED_PICKUP}>Arrived at Loading Dock</option>
                  <option value={MilestoneType.LOADED_IN_TRANSIT}>Cargo Loaded & In Transit</option>
                  <option value={MilestoneType.HALFWAY}>Highway Checkpoint / Toll Crossed</option>
                  <option value={MilestoneType.ARRIVED_DESTINATION}>Arrived at Destination</option>
                  <option value={MilestoneType.UNLOADED}>Cargo Unloaded</option>
                  <option value={MilestoneType.COMPLETED}>Trip Completed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Current Highway Location / Toll *</label>
                <input
                  type="text"
                  required
                  value={milestoneLocation}
                  onChange={(e) => setMilestoneLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  placeholder="e.g. Ludhiana GT Road Toll Plaza"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Operational Notes</label>
                <textarea
                  rows={2}
                  value={milestoneNotes}
                  onChange={(e) => setMilestoneNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  placeholder="e.g. Seal intact, heading on NH44 towards destination"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold transition-colors"
              >
                Broadcast Milestone Update
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Quote Modal from Match */}
      {quoteShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Submit Return Load Bid</h3>
              <button onClick={() => setQuoteShipment(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">{quoteShipment.title}</p>

            <form onSubmit={handleQuickQuoteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Proposed Freight (₹)</label>
                <input
                  type="number"
                  required
                  min={100}
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={quoteSubmitting}
                className="w-full py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold"
              >
                {quoteSubmitting ? 'Submitting...' : 'Submit Quotation to Shipper'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Proof of Delivery (POD) Upload Modal */}
      {podModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2 text-green-600 font-bold text-sm">
                <FileCheck className="w-5 h-5" />
                <span>Upload Proof of Delivery (POD)</span>
              </div>
              <button onClick={() => setPodModalBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Booking Ref: <strong className="text-slate-800 dark:text-white">{podModalBooking.bookingNumber}</strong> ({podModalBooking.shipmentId?.title})
            </p>

            <form onSubmit={handleUploadPod} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Receiver / Consignee Name (Signee) *
                </label>
                <input
                  type="text"
                  required
                  value={podReceiverName}
                  onChange={(e) => setPodReceiverName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                  placeholder="e.g. Ramesh Kumar (Delhi Central Warehouse)"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Delivery Challan & Bilty Notes
                </label>
                <textarea
                  rows={2}
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  placeholder="e.g. 10 Tons received in good condition, seal 84920 verified intact."
                />
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/40 rounded-xl text-green-700 dark:text-green-300 text-[11px] leading-relaxed">
                ✓ Uploading this signed POD will immediately notify the Shipper and mark the booking delivery as verified.
              </div>

              <button
                type="submit"
                disabled={podLoading}
                className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>{podLoading ? 'Submitting POD...' : 'Confirm Delivery & Submit POD'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
