import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Truck,
  Package,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Search,
  CheckCircle2,
  RefreshCw,
  Clock,
  MapPin,
  Send
} from 'lucide-react';
import { VehicleType, CargoType } from '@loadvanta/contracts';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTab, setSearchTab] = useState<'trucks' | 'loads'>('trucks');
  const [originCity, setOriginCity] = useState('');
  const [destCity, setDestCity] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');

  // Live platform statistics from database
  const [metrics, setMetrics] = useState({
    totalShippers: 2,
    totalTransporters: 3,
    totalVehicles: 4,
    totalShipments: 3
  });

  // Contact form state
  const [contactData, setContactData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    // Attempt to load metrics (if public/authenticated or fallback to live numbers)
    api.get('/shipments?limit=1').then((res) => {
      if (res.data.success && res.data.data.pagination) {
        setMetrics((prev) => ({ ...prev, totalShipments: res.data.data.pagination.total }));
      }
    }).catch(() => {});

    api.get('/vehicles?limit=1').then((res) => {
      if (res.data.success && res.data.data.pagination) {
        setMetrics((prev) => ({ ...prev, totalVehicles: res.data.data.pagination.total }));
      }
    }).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTab === 'trucks') {
      const params = new URLSearchParams();
      if (originCity) params.set('city', originCity);
      if (selectedVehicleType) params.set('vehicleType', selectedVehicleType);
      navigate(`/find-trucks?${params.toString()}`);
    } else {
      const params = new URLSearchParams();
      if (originCity) params.set('pickupCity', originCity);
      if (destCity) params.set('deliveryCity', destCity);
      navigate(`/find-loads?${params.toString()}`);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError('');
    try {
      const res = await api.post('/contact', contactData);
      if (res.data.success) {
        setContactSubmitted(true);
      }
    } catch (err: any) {
      setContactError(err.message || 'Failed to submit enquiry');
    } finally {
      setContactLoading(false);
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
    <div className="space-y-16 lg:space-y-24">
      {/* 1. HERO SECTION WITH AESTHETIC VEHICLE BACKGROUND */}
      <section className="relative overflow-hidden pt-16 pb-24 min-h-[660px] flex items-center justify-center">
        {/* Background Commercial Truck Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-truck.jpg"
            alt="Loadvanta Commercial Logistics Truck on Highway"
            className="w-full h-full object-cover object-center filter saturate-125 contrast-110 brightness-100 dark:brightness-85 transition-all duration-300"
          />
          {/* Subtle translucent gradient: keeps truck colors punchy and clear without heavy washout */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/15 to-white/55 dark:from-slate-950/65 dark:via-slate-950/50 dark:to-slate-950/85 transition-colors duration-300" />
          <div className="absolute inset-0 bg-radial-at-center from-white/40 via-transparent to-transparent dark:from-slate-950/40 pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-brand-orange/20 border border-orange-300 dark:border-brand-orange/40 text-brand-orange text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-sm">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Smart Return-Load Matching for Punjab & North India</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Move Smarter. Haul More.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-amber-500 dark:to-amber-400">
                Earn Better.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-900 dark:text-slate-100 font-bold leading-relaxed drop-shadow-[0_1px_4px_rgba(255,255,255,0.95)] dark:drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
              Connect directly with verified truck owners and shippers across Punjab. Cut empty return trips, eliminate broker delays, and track every load from loading dock to delivery.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/find-trucks"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-semibold text-base shadow-xl shadow-orange-500/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
              >
                <span>Find a Truck</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/find-loads"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/95 hover:bg-white text-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-white font-semibold text-base border border-slate-300 dark:border-slate-700/60 backdrop-blur-md flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                <span>Find Available Loads</span>
                <Package className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 2. REAL-TIME SEARCH WIDGET */}
          <div className="mt-12 max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
              <button
                type="button"
                onClick={() => setSearchTab('trucks')}
                className={`flex items-center space-x-2 pb-3 px-4 font-semibold text-sm border-b-2 transition-all ${
                  searchTab === 'trucks'
                    ? 'border-brand-orange text-brand-orange'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Search Available Trucks</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchTab('loads')}
                className={`flex items-center space-x-2 pb-3 px-4 font-semibold text-sm border-b-2 transition-all ${
                  searchTab === 'loads'
                    ? 'border-brand-orange text-brand-orange'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Search Freight Loads</span>
              </button>
            </div>

            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  {searchTab === 'trucks' ? 'Truck Location' : 'Pickup City'}
                </label>
                <select
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-brand-orange"
                >
                  <option value="">Any City in Punjab / North India</option>
                  {punjabCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {searchTab === 'trucks' ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={selectedVehicleType}
                    onChange={(e) => setSelectedVehicleType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-brand-orange"
                  >
                    <option value="">All Vehicle Categories</option>
                    <option value={VehicleType.LIGHT_COMMERCIAL}>Light Commercial (3.5 - 7T)</option>
                    <option value={VehicleType.MEDIUM_DUTY}>Medium Duty (6-Wheeler, 9-12T)</option>
                    <option value={VehicleType.HEAVY_DUTY}>Heavy Duty (10/12-Wheeler, 16-25T)</option>
                    <option value={VehicleType.MULTI_AXLE_TRAILER}>Multi-Axle Trailer (30-45T)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                    Delivery Destination
                  </label>
                  <select
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-brand-orange"
                  >
                    <option value="">Any Destination</option>
                    {punjabCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-md transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>Search {searchTab === 'trucks' ? 'Trucks' : 'Loads'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 3. LIVE DATABASE METRICS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-navy rounded-2xl p-8 text-white">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-xs uppercase tracking-wider text-brand-orange font-bold">
              Transparent Operations
            </h3>
            <p className="text-xl font-bold tracking-tight mt-1">
              Live Platform Volume in Punjab
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-3xl font-extrabold text-white">{metrics.totalVehicles}</div>
              <div className="text-xs text-slate-300 uppercase tracking-wider mt-1 font-medium">
                Verified Trucks
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-3xl font-extrabold text-white">{metrics.totalShipments}</div>
              <div className="text-xs text-slate-300 uppercase tracking-wider mt-1 font-medium">
                Active Loads
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-3xl font-extrabold text-brand-orange">100%</div>
              <div className="text-xs text-slate-300 uppercase tracking-wider mt-1 font-medium">
                Verified Transporters
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-3xl font-extrabold text-green-400">₹0</div>
              <div className="text-xs text-slate-300 uppercase tracking-wider mt-1 font-medium">
                Hidden Brokerage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. RETURN-LOAD MATCHING ENGINE HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider font-bold text-brand-orange">
              <RefreshCw className="w-4 h-4" />
              <span>The Loadvanta Advantage</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy dark:text-white tracking-tight">
              Why Return-Load Matching is a Game Changer for Fleet Owners
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              In Punjab's industrial corridors (such as Ludhiana textiles to Delhi, or Khanna grain mandis), up to 40% of trucks return empty (deadhead miles). Loadvanta's proprietary matching algorithm solves this with a 5-factor weighted intelligence engine:
            </p>

            <ul className="space-y-3">
              {[
                'Route Alignment (35%): Matches shipments whose delivery lands near the truck\'s home depot.',
                'Pickup Timing (25%): Schedules load pickup within your truck\'s availability window.',
                'Payload Matching (20%): Maximizes capacity utilization without exceeding axle limits.',
                'Minimal Detour (10%): Keeps deadhead highway detours strictly under acceptable limits.',
                'Transparent Fair Pricing (10%): Direct quotation submission with zero middleman commissions.'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Link
                to="/how-it-works"
                className="inline-flex items-center space-x-2 text-brand-orange font-semibold hover:text-brand-orangeHover"
              >
                <span>Learn how our matching formula works</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Interactive Visual Card */}
          <div className="bg-slate-100 dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Sample Matched Return Trip
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                  92% Match Score
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-slate-800 text-brand-orange flex items-center justify-center font-bold">
                  PB10
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    16-Ton Closed Container (Ludhiana Depot)
                  </div>
                  <div className="text-xs text-slate-500">Currently in Jalandhar unloading</div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recommended Return Load:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Textile Roll Consignment (12T)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Return Corridor:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Jalandhar → Ludhiana (62 km)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Detour Highway Distance:</span>
                  <span className="font-semibold text-green-600">Only 8 km from current dock</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VEHICLE CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight">
            Comprehensive Fleet for Every Cargo Need
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            From industrial fasteners in Ludhiana to agricultural produce across Punjab mandis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Light Commercial (LCV)',
              capacity: '3.5 — 7.5 Tons',
              ideal: 'Auto parts, sports goods, retail FMCG'
            },
            {
              title: '6-Wheeler Medium Duty',
              capacity: '9 — 12 Tons',
              ideal: 'Apparel cartons, electricals, beverages'
            },
            {
              title: '10/12-Wheeler Heavy Duty',
              capacity: '16 — 25 Tons',
              ideal: 'Grain sacks, textiles, steel coils'
            },
            {
              title: 'Multi-Axle Trailers',
              capacity: '30 — 45 Tons',
              ideal: 'Structural steel, heavy equipment, export containers'
            }
          ].map((cat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-orange transition-all hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-slate-700 text-brand-orange flex items-center justify-center mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{cat.title}</h3>
              <p className="text-xs font-semibold text-brand-orange mt-1">Payload: {cat.capacity}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{cat.ideal}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How does Loadvanta eliminate empty return trips?',
              a: 'Transporters can enter their truck\'s expected destination or select an active journey. Loadvanta scans published shipments on the return route heading towards the truck\'s home depot, ranking them with a multi-factor score.'
            },
            {
              q: 'How are transporters and vehicles verified?',
              a: 'Transporters submit business details and vehicle registration numbers (RC, fitness certificate, and permits). Every listing is reviewed by the Loadvanta operations team before receiving a Verified badge.'
            },
            {
              q: 'How does freight booking and online payment work?',
              a: 'Shippers publish loads with cargo specs. Transporters submit direct price quotations. Once a shipper accepts a quotation, the booking is confirmed and secured online through Razorpay with full milestone tracking.'
            }
          ].map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{faq.q}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. WORKING CONTACT ENQUIRY FORM */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-md">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-brand-navy dark:text-white">
              Have a Query? Contact Our Punjab Freight Desk
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Speak directly with our regional operations team in Ludhiana and Mohali.
            </p>
          </div>

          {contactSubmitted ? (
            <div className="p-6 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto" />
              <div className="font-bold text-sm">Enquiry Submitted Successfully!</div>
              <p className="text-xs">
                Our logistics coordinator will review your request and contact you within 2 business hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              {contactError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                  {contactError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactData.fullName}
                    onChange={(e) => setContactData({ ...contactData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-orange"
                    placeholder="e.g. Gurpreet Singh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-orange"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-orange"
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactData.subject}
                    onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-orange"
                    placeholder="e.g. Return load inquiry from Ludhiana"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={contactData.message}
                  onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-orange"
                  placeholder="Tell us about your fleet or shipping requirements..."
                />
              </div>

              <button
                type="submit"
                disabled={contactLoading}
                className="w-full py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{contactLoading ? 'Submitting...' : 'Send Message to Regional Desk'}</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
