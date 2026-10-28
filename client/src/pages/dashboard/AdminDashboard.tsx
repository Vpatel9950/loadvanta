import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import {
  ShieldCheck,
  Users,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  History
} from 'lucide-react';
import { VerificationStatus, UserRole } from '@loadvanta/contracts';
import { AdminFleetRadar } from '../../components/tracking/AdminFleetRadar';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'verifications' | 'vehicles' | 'fleet_radar' | 'users' | 'logs' | 'enquiries'>('verifications');

  const [metrics, setMetrics] = useState<any>(null);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, tRes, vRes, uRes, lRes, eRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/verifications/transporters'),
        api.get('/admin/verifications/vehicles'),
        api.get('/admin/users'),
        api.get('/admin/audit-logs'),
        api.get('/admin/enquiries')
      ]);

      if (mRes.data.success) setMetrics(mRes.data.data);
      if (tRes.data.success) setTransporters(tRes.data.data || []);
      if (vRes.data.success) setVehicles(vRes.data.data || []);
      if (uRes.data.success) setUsersList(uRes.data.data || []);
      if (lRes.data.success) setAuditLogs(lRes.data.data || []);
      if (eRes.data.success) setEnquiries(eRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleReviewTransporter = async (id: string, status: VerificationStatus) => {
    try {
      const res = await api.post(`/admin/verifications/transporters/${id}`, {
        status,
        notes: `Reviewed by Administrator on ${new Date().toLocaleDateString()}`
      });
      if (res.data.success) {
        loadAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Review failed');
    }
  };

  const handleReviewVehicle = async (id: string, status: VerificationStatus) => {
    try {
      const res = await api.post(`/admin/verifications/vehicles/${id}`, { status });
      if (res.data.success) {
        loadAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Review failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-brand-orange" />
            <span>Loadvanta Control Terminal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Punjab & North India regional compliance, moderation, and fleet oversight
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Metrics Row from genuine MongoDB collections */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Users</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{metrics.totalUsers}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{metrics.totalShippers} Shippers | {metrics.totalTransporters} Transporters</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Fleet Trucks</span>
            <div className="text-2xl font-black text-brand-orange mt-1">{metrics.totalVehicles}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Commercial Units</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Loads</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{metrics.totalShipments}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Published Consignments</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Bookings</span>
            <div className="text-2xl font-black text-green-600 mt-1">{metrics.totalBookings}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Confirmed Journeys</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">GMV Settled</span>
            <div className="text-2xl font-black text-brand-navy dark:text-white mt-1">
              ₹{(metrics.grossRevenueInr || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Verified Online Volume</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'verifications' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Transporter Verification Queue ({transporters.length})
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'vehicles' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Vehicle Approvals ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('fleet_radar')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center space-x-2 ${
            activeTab === 'fleet_radar' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          <span>Live Fleet Radar</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'users' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          User Directory ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'logs' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Audit Logs ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('enquiries')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'enquiries' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Contact Enquiries ({enquiries.length})
        </button>
      </div>

      {/* Tab 1: Transporters */}
      {activeTab === 'verifications' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Transporter Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {transporters.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{t.fullName}</td>
                    <td className="py-3.5 px-4">{t.companyName || 'Individual Owner'}</td>
                    <td className="py-3.5 px-4">{t.phone} ({t.email})</td>
                    <td className="py-3.5 px-4">{t.city}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        t.verificationStatus === 'VERIFIED'
                          ? 'bg-green-100 text-green-700'
                          : t.verificationStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {t.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleReviewTransporter(t._id, VerificationStatus.VERIFIED)}
                        className="px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-[11px]"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleReviewTransporter(t._id, VerificationStatus.REJECTED)}
                        className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[11px]"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Vehicle Approvals */}
      {activeTab === 'vehicles' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Transporter</th>
                  <th className="py-3 px-4">Type & Payload</th>
                  <th className="py-3 px-4">Depot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {vehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {v.registrationNumber}
                    </td>
                    <td className="py-3.5 px-4">{v.transporterId?.companyName || v.transporterId?.fullName}</td>
                    <td className="py-3.5 px-4">{v.capacityTons}T ({v.vehicleType})</td>
                    <td className="py-3.5 px-4">{v.currentCity}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        v.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {v.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleReviewVehicle(v._id, VerificationStatus.VERIFIED)}
                        className="px-2.5 py-1 rounded-lg bg-green-600 text-white font-bold text-[11px]"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewVehicle(v._id, VerificationStatus.REJECTED)}
                        className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 font-bold text-[11px]"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Users */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{u.fullName}</td>
                    <td className="py-3.5 px-4">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 dark:bg-slate-700 uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{u.city}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                {auditLogs.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-3.5 px-4 font-bold text-brand-orange">{l.action}</td>
                    <td className="py-3.5 px-4">{l.targetEntity} ({l.targetId?.slice(-6)})</td>
                    <td className="py-3.5 px-4">{l.actorRole || 'System'}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Live Fleet GPS Radar */}
      {activeTab === 'fleet_radar' && <AdminFleetRadar />}

      {/* Tab 5: Contact Enquiries */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          {enquiries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">No enquiries received yet</div>
          ) : (
            enquiries.map((e) => (
              <div key={e._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-sm text-slate-900 dark:text-white">{e.subject}</strong>
                    <div className="text-slate-500 mt-0.5">From: {e.fullName} ({e.email}) {e.phone && `| ${e.phone}`}</div>
                  </div>
                  <span className="text-slate-400">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
                <p className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-300">
                  {e.message}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
