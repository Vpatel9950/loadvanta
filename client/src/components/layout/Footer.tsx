import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-navy text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-brand-orange border border-slate-700">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                LOAD<span className="text-brand-orange">VANTA</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 font-medium">
              Every Mile Counts. Every Load Matters.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Punjab's digital freight marketplace connecting industrial shippers with verified fleet owners. Eliminating empty return trips across North India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/find-trucks" className="hover:text-brand-orange transition-colors">
                  Find Available Trucks
                </Link>
              </li>
              <li>
                <Link to="/find-loads" className="hover:text-brand-orange transition-colors">
                  Find Loads & Freight
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-brand-orange transition-colors">
                  How Return Matching Works
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-orange transition-colors">
                  Join as Transporter
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-orange transition-colors">
                  Register as Shipper
                </Link>
              </li>
            </ul>
          </div>

          {/* Key Freight Corridors */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Major Corridors
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                <span>Ludhiana — Delhi NCR Corridor</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                <span>Ludhiana — Jalandhar — Amritsar</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                <span>Khanna Mandi — Delhi Grain Route</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                <span>Mandi Gobindgarh — Ludhiana Steel</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                <span>Bathinda — Chandigarh Highway</span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Regional Desk
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <span>Phase 8B, Industrial Area, Mohali, Punjab 160055</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-brand-orange shrink-0" />
                <span>+91 161 500 2400 (Punjab Regional)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-brand-orange shrink-0" />
                <span>support@loadvanta.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Loadvanta Logistics Technologies Pvt Ltd. All rights reserved.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/contact" className="hover:text-slate-300 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
