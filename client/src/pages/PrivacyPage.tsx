import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1">Compliance with Digital Personal Data Protection Act (DPDPA)</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Information We Collect</h2>
          <p>
            Loadvanta collects business and personal information necessary to facilitate logistics contracts: user contact details, company registration data, driver license and vehicle documents (RC, insurance), and transaction records.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Vehicle Document Privacy</h2>
          <p>
            Private documents uploaded for vehicle and transporter verification (such as RC copies or identity proof) are stored in restricted access storage and are accessible solely to authorized Loadvanta compliance personnel.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Data Security & Payment Information</h2>
          <p>
            We implement encryption in transit (TLS 1.3) and at rest. Payment processing is handled directly through RBI-authorized payment aggregators (e.g., Razorpay). Sensitive card numbers and net banking credentials are never retained on Loadvanta servers.
          </p>
        </section>
      </div>
    </div>
  );
};
