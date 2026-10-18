import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-slate-800 text-brand-orange mx-auto flex items-center justify-center font-bold">
          <Truck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-6xl font-black text-brand-navy dark:text-white">404</h1>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-2">
            Highway Detour — Page Not Found
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            The route or freight consignment you are looking for has been moved or does not exist.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Loadvanta Home</span>
        </Link>
      </div>
    </div>
  );
};
