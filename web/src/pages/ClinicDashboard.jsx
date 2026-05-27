import { useEffect, useState } from 'react';
import { getClinicDashboard, getDoseHistory } from '../api';
import { useAuthStore } from '../store/authStore';
import RiskBadge from '../components/RiskBadge';

export default function ClinicDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const { user, clearSession } = useAuthStore();

    useEffect(() => {
        getClinicDashboard()
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const handleViewHistory = async (patient) => {
        setSelectedPatient(patient);
        try {
            const result = await getDoseHistory(patient.id, { limit: 50 });
            setHistory(result.history || []);
        } catch {
            setHistory([]);
        }
    };

    const handlePrint = () => window.print();

    if (loading) return (
        <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
            Loading dashboard...
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen text-red-600 text-sm">
            {error}
        </div>
    );

    const { summary, patients } = data || { summary: {}, patients: [] };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="font-bold text-gray-900">MedMate — Clinic</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{user?.name}</span>
                    <button
                        onClick={clearSession}
                        className="text-sm text-red-600 hover:underline"
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Patient Overview</h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Patients', value: summary.total || 0, colour: 'bg-gray-100 text-gray-800' },
                        { label: 'Green (On Track)', value: summary.green || 0, colour: 'bg-green-100 text-green-800' },
                        { label: 'Amber (At Risk)', value: summary.amber || 0, colour: 'bg-yellow-100 text-yellow-800' },
                        { label: 'Red (High Risk)', value: summary.red || 0, colour: 'bg-red-100 text-red-800' },
                    ].map((card) => (
                        <div key={card.label} className={`rounded-xl p-4 ${card.colour}`}>
                            <p className="text-2xl font-bold">{card.value}</p>
                            <p className="text-sm mt-1">{card.label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">All Patients</h2>
                        <button
                            onClick={handlePrint}
                            className="text-sm text-violet-600 font-medium hover:underline"
                        >
                            Print / Export PDF
                        </button>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 text-left">Name</th>
                                <th className="px-6 py-3 text-left">City</th>
                                <th className="px-6 py-3 text-left">Adherence</th>
                                <th className="px-6 py-3 text-left">Risk</th>
                                <th className="px-6 py-3 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {patients.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.city || '—'}</td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {p.latestRisk ? `${p.latestRisk.score}%` : '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <RiskBadge tier={p.latestRisk?.tier} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleViewHistory(p)}
                                            className="text-violet-600 text-sm font-medium hover:underline"
                                        >
                                            View history
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {patients.length === 0 && (
                        <p className="text-center text-gray-400 py-12 text-sm">No patients found.</p>
                    )}
                </div>

                {selectedPatient && (
                    <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-gray-800">
                                Dose History — {selectedPatient.name}
                            </h2>
                            <button
                                onClick={() => { setSelectedPatient(null); setHistory([]); }}
                                className="text-sm text-gray-400 hover:text-gray-600"
                            >
                                Close
                            </button>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-2 text-left">Medication</th>
                                    <th className="px-4 py-2 text-left">Scheduled</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.map((d) => (
                                    <tr key={d.id}>
                                        <td className="px-4 py-3">{d.medication?.name}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {new Date(d.scheduled_time).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 capitalize">{d.status}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {d.missed_reason?.replace(/_/g, ' ') || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}