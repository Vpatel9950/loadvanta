import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  MapPin,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-brand-navy dark:text-white tracking-tight">
          How Loadvanta Works
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          Transforming freight transport across Punjab by eliminating middleman delays, verifying every fleet operator, and solving empty return running.
        </p>
      </div>

      {/* For Shippers vs For Transporters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Shippers */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-slate-700 text-brand-orange flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">For Shippers & Mills</h2>
              <p className="text-xs text-slate-500">Post cargo, compare quotes, pay and track</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-slate-900 dark:text-white block">Publish Cargo Consignment</strong>
                <span className="text-xs text-slate-500">Specify pickup/delivery cities in Punjab, cargo category, weight, and target rate.</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-slate-900 dark:text-white block">Compare Direct Fleet Quotes</strong>
                <span className="text-xs text-slate-500">Receive competitive bids from verified truck owners without commission markups.</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-slate-900 dark:text-white block">Confirm & Pay Securely</strong>
                <span className="text-xs text-slate-500">Accept the best quotation, lock the truck, and settle securely via Razorpay.</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
              <div>
                <strong className="text-slate-900 dark:text-white block">Track Trip & Delivery Proof</strong>
                <span className="text-xs text-slate-500">Follow live highway milestones and view receiver-signed Proof of Delivery (POD).</span>
              </div>
            </div>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-brand-orange hover:text-brand-orangeHover"
          >
            <span>Register as Shipper</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Transporters */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-slate-700 text-brand-navy dark:text-blue-400 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">For Transporters & Fleet Owners</h2>
              <p className="text-xs text-slate-500">Eliminate deadhead miles and haul profitable return loads</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-brand-navy dark:bg-slate-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-slate-900 dark:text-white block">Onboard Your Fleet</strong>
                <span className="text-xs text-slate-500">Register your vehicles with registration numbers, tonnage, and body types for verification.</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-brand-navy dark:bg-slate-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-slate-900 dark:text-white block">Smart Return Load Matching</strong>
                <span className="text-xs text-slate-500">Our engine scans shipments on your return corridor and calculates match scores.</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-brand-navy dark:bg-slate-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-slate-900 dark:text-white block">Quote Fair Rates</strong>
                <span className="text-xs text-slate-500">Submit competitive direct quotes based on your actual route and schedule.</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-brand-navy dark:bg-slate-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
              <div>
                <strong className="text-slate-900 dark:text-white block">Haul, Deliver & Earn</strong>
                <span className="text-xs text-slate-500">Update transit milestones, upload proof of delivery, and receive guaranteed payout.</span>
              </div>
            </div>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-brand-navy dark:text-blue-400 hover:underline"
          >
            <span>Register as Transporter</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Return-Load Matching Engine Deep Dive */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 text-brand-orange text-xs font-bold uppercase tracking-wider">
            <RefreshCw className="w-4 h-4" />
            <span>The 5-Factor Matching Formula</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            How Return Loads are Ranked
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Unlike generic classified boards where transporters have to manually call dozens of brokers, Loadvanta automatically ranks potential loads using a 100-point transparent score:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-brand-orange text-sm mb-1">Route Compatibility (35%)</div>
              <p className="text-slate-500">Prioritizes shipments whose pickup is near your current truck location and whose delivery point brings the vehicle closer to its home base.</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-brand-orange text-sm mb-1">Timing Window (25%)</div>
              <p className="text-slate-500">Matches loads that align with the vehicle's ready-to-load availability date, minimizing waiting time at the terminal.</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-brand-orange text-sm mb-1">Payload Efficiency (20%)</div>
              <p className="text-slate-500">Ensures optimal truck capacity utilization (70% - 100%) while preventing overloading violations.</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-brand-orange text-sm mb-1">Detour & Pricing (20%)</div>
              <p className="text-slate-500">Calculates deadhead kilometers and evaluates target freight rates against prevailing corridor benchmarks.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
