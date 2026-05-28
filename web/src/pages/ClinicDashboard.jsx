import { useEffect, useState, useCallback } from 'react';
import { getClinicDashboard, getDoseHistory } from '../api';
import { useAuthStore } from '../store/authStore';
import NavBar from '../components/NavBar';
import RiskBadge from '../components/RiskBadge';

const fmt = (iso) => new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
});

const STATUS_STYLE = {
    taken: { label: 'Taken', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    late: { label: 'Taken Late', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    missed: { label: 'Missed', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    pending: { label: 'Pending', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};

function StatCard({ label, value, sub, colour }) {
    return (
        <div className={`rounded-2xl p-5 border ${colour} fade-up`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm font-medium mt-1">{label}</p>
            {sub && <p className="text-xs mt-0.5 opacity-70">{sub}</p>}
        </div>
    );
}

export default function ClinicDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState('all');

    const { user } = useAuthStore();

    const loadDashboard = useCallback(() => {
        setLoading(true);
        getClinicDashboard()
            .then(setData)
            .catch((e) => setError(e.message || 'Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    const handleViewHistory = async (patient) => {
        setSelectedPatient(patient);
        setHistoryLoading(true);
        try {
            const result = await getDoseHistory(patient.id, { limit: 100 });
            setHistory(result.history || []);
        } catch {
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleCloseHistory = () => {
        setSelectedPatient(null);
        setHistory([]);
    };

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ background: '#FDF6EE' }}>
                <NavBar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-[#7C6F9A]">
                        <svg className="animate-spin w-8 h-8 text-[#7C3AED]" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm font-medium">Loading patient data...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col" style={{ background: '#FDF6EE' }}>
                <NavBar />
                <div className="flex-1 flex items-center justify-center px-6">
                    <div className="bg-[#FFF1F2] border border-[#FDA4AF] rounded-2xl p-8 text-center max-w-md">
                        <p className="text-[#9F1239] font-medium">{error}</p>
                        <button onClick={loadDashboard} className="mt-4 text-sm text-[#7C3AED] font-semibold hover:underline">
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { summary = {}, patients = [] } = data || {};

    const filteredPatients = patients.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.city || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchRisk = riskFilter === 'all' || (p.latestRisk?.tier || 'unscored') === riskFilter;
        return matchSearch && matchRisk;
    });

    return (
        <div className="min-h-screen" style={{ background: '#FDF6EE' }}>
            <NavBar />

            <div className="max-w-7xl mx-auto px-6 py-8">

                <div className="flex items-center justify-between mb-8 fade-up">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1E1033]">Patient Overview</h1>
                        <p className="text-sm text-[#7C6F9A] mt-1">
                            Weekly adherence and risk scores - updated every Sunday
                        </p>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="no-print flex items-center gap-2 text-sm font-semibold text-[#7C3AED] hover:bg-[#EDE9FE] px-4 py-2 rounded-full border border-[#C4B5FD] transition-colors"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                        </svg>
                        Print / Export
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Patients" value={summary.total || 0} colour="bg-[#FFF9F7] border-[#E9E0F8] text-[#1E1033]" />
                    <StatCard label="On Track" value={summary.green || 0} colour="bg-emerald-50 border-emerald-200 text-emerald-800" sub="Adherence >= 90%" />
                    <StatCard label="At Risk" value={summary.amber || 0} colour="bg-amber-50 border-amber-200 text-amber-800" sub="75% - 89%" />
                    <StatCard label="High Risk" value={summary.red || 0} colour="bg-rose-50 border-rose-200 text-rose-800" sub="Adherence < 75%" />
                </div>

                <div className="no-print flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="relative flex-1">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C6F9A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-[#E9E0F8] rounded-xl text-sm text-[#1E1033] bg-[#FFF9F7] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] placeholder-[#7C6F9A]"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'green', 'amber', 'red', 'unscored'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setRiskFilter(f)}
                                className={`text-xs font-semibold px-3 py-2 rounded-full border capitalize transition-colors ${riskFilter === f
                                    ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                                    : 'bg-[#FFF9F7] text-[#7C6F9A] border-[#E9E0F8] hover:border-[#C4B5FD]'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f === 'unscored' ? 'No data' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#FFF9F7] rounded-2xl border border-[#E9E0F8] overflow-hidden shadow-sm print-table fade-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#F5F3FF] border-b border-[#E9E0F8]">
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7C6F9A] uppercase tracking-wide">Patient</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7C6F9A] uppercase tracking-wide">City</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7C6F9A] uppercase tracking-wide">Adherence</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7C6F9A] uppercase tracking-wide">Risk</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7C6F9A] uppercase tracking-wide no-print">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F5F3FF]">
                                {filteredPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[#7C6F9A] text-sm">
                                            No patients match your search.
                                        </td>
                                    </tr>
                                ) : filteredPatients.map((p) => (
                                    <tr
                                        key={p.id}
                                        className={`hover:bg-[#FDFCFB] transition-colors ${selectedPatient?.id === p.id ? 'bg-[#EDE9FE]' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-[#7C3AED]">
                                                        {(p.name || '?')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-[#1E1033]">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#7C6F9A]">{p.city || '--'}</td>
                                        <td className="px-6 py-4">
                                            {p.latestRisk ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-[#E9E0F8] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${p.latestRisk.tier === 'green' ? 'bg-emerald-500' :
                                                                p.latestRisk.tier === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`}
                                                            style={{ width: `${p.latestRisk.score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold text-[#1E1033]">{p.latestRisk.score}%</span>
                                                </div>
                                            ) : (
                                                <span className="text-[#7C6F9A] text-sm">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <RiskBadge tier={p.latestRisk?.tier} />
                                        </td>
                                        <td className="px-6 py-4 no-print">
                                            <button
                                                onClick={() => selectedPatient?.id === p.id ? handleCloseHistory() : handleViewHistory(p)}
                                                className="text-sm font-semibold text-[#7C3AED] hover:text-[#5B21B6] hover:underline transition-colors"
                                            >
                                                {selectedPatient?.id === p.id ? 'Close' : 'View history'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {selectedPatient && (
                    <div className="mt-6 bg-[#FFF9F7] rounded-2xl border border-[#E9E0F8] overflow-hidden shadow-sm fade-up">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9E0F8] bg-[#F5F3FF]">
                            <div>
                                <h2 className="font-semibold text-[#1E1033]">
                                    Dose History -- {selectedPatient.name}
                                </h2>
                                <p className="text-xs text-[#7C6F9A] mt-0.5">Last 100 events</p>
                            </div>
                            <button
                                onClick={handleCloseHistory}
                                className="w-8 h-8 rounded-full bg-[#FFF9F7] border border-[#E9E0F8] flex items-center justify-center text-[#7C6F9A] hover:text-[#1E1033] transition-colors"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {historyLoading ? (
                            <div className="py-12 flex justify-center">
                                <svg className="animate-spin w-6 h-6 text-[#7C3AED]" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </div>
                        ) : history.length === 0 ? (
                            <p className="text-center text-[#7C6F9A] py-10 text-sm">No dose history found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#FDFCFB] border-b border-[#E9E0F8]">
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-[#7C6F9A] uppercase tracking-wide">Medication</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-[#7C6F9A] uppercase tracking-wide">Scheduled</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-[#7C6F9A] uppercase tracking-wide">Status</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-[#7C6F9A] uppercase tracking-wide">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F5F3FF]">
                                        {history.map((d) => {
                                            const st = STATUS_STYLE[d.status] || { label: d.status, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
                                            return (
                                                <tr key={d.id} className="hover:bg-[#FDFCFB]">
                                                    <td className="px-5 py-3 font-medium text-[#1E1033]">{d.medication?.name}</td>
                                                    <td className="px-5 py-3 text-[#7C6F9A]">{fmt(d.scheduled_time)}</td>
                                                    <td className="px-5 py-3">
                                                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${st.cls}`}>
                                                            {st.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-[#7C6F9A] capitalize">
                                                        {d.missed_reason?.replace(/_/g, ' ') || '--'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}