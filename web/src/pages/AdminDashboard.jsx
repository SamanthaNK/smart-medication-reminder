import { useEffect, useState } from 'react';
import { getPlatformStats, verifyUser } from '../api';
import { useAuthStore } from '../store/authStore';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifyId, setVerifyId] = useState('');
    const [verifyMsg, setVerifyMsg] = useState(null);
    const { user, clearSession } = useAuthStore();

    useEffect(() => {
        getPlatformStats()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleVerify = async () => {
        if (!verifyId.trim()) return;
        try {
            const res = await verifyUser(verifyId.trim());
            setVerifyMsg(`Verified: ${res.userId}`);
            setVerifyId('');
        } catch (err) {
            setVerifyMsg(`Error: ${err.message}`);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
            Loading...
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="font-bold text-gray-900">MedMate — Admin</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{user?.name}</span>
                    <button onClick={clearSession} className="text-sm text-red-600 hover:underline">
                        Sign out
                    </button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Statistics</h1>

                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        {[
                            { label: 'Patients', value: stats.users?.patient || 0 },
                            { label: 'Caregivers', value: stats.users?.caregiver || 0 },
                            { label: 'Clinic Staff', value: stats.users?.clinic_staff || 0 },
                            { label: 'Active Medications', value: stats.medications?.total || 0 },
                            { label: 'Doses Taken', value: stats.doseEvents?.taken || 0 },
                            { label: 'Doses Missed', value: stats.doseEvents?.missed || 0 },
                            { label: 'Total Alerts', value: stats.alerts?.total || 0 },
                            { label: 'Unacknowledged Alerts', value: stats.alerts?.unacknowledged || 0 },
                        ].map((card) => (
                            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
                                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="font-semibold text-gray-800 mb-4">Verify Clinic Staff Account</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Enter the user ID of a clinic_staff account to verify it. They will not be able to use the dashboard until verified.
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="User UUID"
                            value={verifyId}
                            onChange={(e) => { setVerifyId(e.target.value); setVerifyMsg(null); }}
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <button
                            onClick={handleVerify}
                            className="bg-violet-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-violet-700 transition"
                        >
                            Verify
                        </button>
                    </div>
                    {verifyMsg && (
                        <p className="text-sm mt-3 text-gray-700">{verifyMsg}</p>
                    )}
                </div>
            </div>
        </div>
    );
}