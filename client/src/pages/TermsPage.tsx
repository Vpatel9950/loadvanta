import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-500 mt-1">Last Updated: October 2026</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Platform Services</h2>
          <p>
            Loadvanta provides a digital marketplace connecting businesses requiring commercial freight movement (“Shippers”) with commercial vehicle owners, fleet operators, and logistics companies (“Transporters”).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Transporter Verification & Compliance</h2>
          <p>
            Transporters agree to maintain valid vehicle registration (RC), valid commercial permits, fitness certificates, third-party and cargo insurance, and pollution under control (PUC) certificates in compliance with the Motor Vehicles Act, 1988 and applicable Punjab state transport regulations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Quotations, Bookings & Concurrency</h2>
          <p>
            Quotations submitted by Transporters represent binding operational commitments once accepted by a Shipper. Double-booking or accepting conflicting consignments for the same vehicle is strictly prohibited and subject to account suspension.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Payment Terms & Settlement</h2>
          <p>
            Freight payments processed online through Loadvanta utilize licensed payment gateways (including Razorpay). Funds are disbursed in accordance with agreed commercial milestones and submission of valid Proof of Delivery (POD).
          </p>
        </section>
      </div>
    </div>
  );
};
