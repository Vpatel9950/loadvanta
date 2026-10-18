import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { Truck, LogIn, Key, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { UserRole } from '@loadvanta/contracts';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // Determine destination
      // Next tick navigation handled by context or manual check
      setTimeout(() => {
        const storedToken = localStorage.getItem('loadvanta_token');
        if (storedToken) {
          // Read payload
          try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            if (payload.role === UserRole.ADMIN) navigate('/dashboard/admin');
            else if (payload.role === UserRole.TRANSPORTER) navigate('/dashboard/transporter');
            else navigate('/dashboard/shipper');
          } catch {
            navigate('/');
          }
        }
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (role: 'shipper' | 'transporter' | 'admin') => {
    if (role === 'shipper') {
      setEmail('shipper@loadvanta.com');
      setPassword('Password@123');
    } else if (role === 'transporter') {
      setEmail('transporter@loadvanta.com');
      setPassword('Password@123');
    } else {
      setEmail('admin@loadvanta.com');
      setPassword('Password@123');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-navy dark:bg-slate-700 text-brand-orange mx-auto flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-brand-navy dark:text-white tracking-tight">
            Sign In to Loadvanta
          </h1>
          <p className="text-xs text-slate-500">
            Access your Punjab freight operations, loads, and quotes
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-orange"
                placeholder="name@loadvanta.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-orange"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Quick Test Logins for easy evaluation */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
          <span className="block text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            1-Click Demo Accounts
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickLogin('shipper')}
              className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-orange-50 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
            >
              Shipper
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('transporter')}
              className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-orange-50 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
            >
              Transporter
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('admin')}
              className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-orange-50 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-brand-orange hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};
