import React from 'react';
import { Truck, ShieldCheck, Target, Globe2, Compass } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-brand-orange text-xs font-bold uppercase tracking-wider">
          <span>About Loadvanta</span>
        </div>
        <h1 className="text-4xl font-extrabold text-brand-navy dark:text-white tracking-tight">
          Every Mile Counts. Every Load Matters.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          Loadvanta is an intelligent B2B freight marketplace built to digitize commercial road logistics, starting with Punjab and expanding across North India.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-slate-700 text-brand-orange flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Our Mission</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            To provide fleet owners and shippers with direct, transparent, and technology-driven access to cargo and capacity, cutting out multiple tiers of unverified brokerage and dramatically reducing empty kilometers.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-slate-700 text-brand-navy dark:text-blue-400 flex items-center justify-center font-bold">
            <Globe2 className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Our Vision</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            To build the most reliable digital freight highway across India, empowering independent truck drivers and enterprise shippers alike with instant price discovery, secure digital escrow, and guaranteed return loads.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">The Empty-Running Challenge in Punjab</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Punjab is an agricultural and industrial powerhouse. Cities like Ludhiana produce world-class hosiery, bicycles, and auto parts; Jalandhar is famous for sports goods; Mandi Gobindgarh is India's premier steel town; and Khanna houses one of Asia’s largest grain markets.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          However, traditional logistics is fragmented. Trucks hauling goods from Ludhiana to Delhi or Amritsar frequently travel hundreds of kilometers back without cargo, burning fuel and losing revenue. Loadvanta bridges this gap by automatically matching available capacity with genuine return freight consignments.
        </p>
      </div>
    </div>
  );
};
