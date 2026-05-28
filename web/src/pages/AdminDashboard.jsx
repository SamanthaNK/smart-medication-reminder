import { useEffect, useState } from 'react';
import { getPlatformStats, verifyUser } from '../api';
import { useAuthStore } from '../store/authStore';
import NavBar from '../components/NavBar';
import { Link } from 'react-router-dom';

function MetricCard({ label, value, icon, colour }) {
    return (
        <div className={`bg-[#FFF9F7] rounded-2xl border border-[#E9E0F8] p-5 fade-up hover:shadow-sm transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colour}`}>
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-bold text-[#1E1033]">{value ?? '--'}</p>
            <p className="text-sm text-[#7C6F9A] mt-1">{label}</p>
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifyId, setVerifyId] = useState('');
    const [verifyMsg, setVerifyMsg] = useState(null);
    const [verifyErr, setVerifyErr] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const { user } = useAuthStore();

    useEffect(() => {
        getPlatformStats()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleVerify = async () => {
        if (!verifyId.trim()) return;
        setVerifying(true);
        setVerifyMsg(null);
        setVerifyErr(null);
        try {
            const res = await verifyUser(verifyId.trim());
            setVerifyMsg(`Account verified successfully. User ID: ${res.userId}`);
            setVerifyId('');
        } catch (err) {
            setVerifyErr(err.message || 'Verification failed.');
        } finally {
            setVerifying(false);
        }
    };

    const METRICS = stats ? [
        { label: 'Patients', value: stats.users?.patient || 0, colour: 'bg-violet-100 text-violet-600', icon: patientIcon },
        { label: 'Caregivers', value: stats.users?.caregiver || 0, colour: 'bg-blue-100 text-blue-600', icon: caregiverIcon },
        { label: 'Clinic Staff', value: stats.users?.clinic_staff || 0, colour: 'bg-emerald-100 text-emerald-600', icon: staffIcon },
        { label: 'Active Medications', value: stats.medications?.total || 0, colour: 'bg-orange-100 text-orange-600', icon: medIcon },
        { label: 'Doses Taken', value: stats.doseEvents?.taken || 0, colour: 'bg-emerald-100 text-emerald-600', icon: checkIcon },
        { label: 'Doses Missed', value: stats.doseEvents?.missed || 0, colour: 'bg-rose-100 text-rose-600', icon: missIcon },
        { label: 'Total Alerts', value: stats.alerts?.total || 0, colour: 'bg-amber-100 text-amber-600', icon: alertIcon },
        { label: 'Unacknowledged Alerts', value: stats.alerts?.unacknowledged || 0, colour: 'bg-rose-100 text-rose-600', icon: unreadIcon },
    ] : [];

    return (
        <div className="min-h-screen" style={{ background: '#FDF6EE' }}>
            <NavBar />

            <div className="max-w-6xl mx-auto px-6 py-8">

                <div className="mb-8 fade-up">
                    <h1 className="text-2xl font-bold text-[#1E1033]">Platform Overview</h1>
                    <p className="text-sm text-[#7C6F9A] mt-1">Real-time statistics across all MedMate users</p>
                </div>

                <Link
                    to="/clinic"
                    className="no-print mb-6 flex items-center justify-between bg-[#EDE9FE] border border-[#C4B5FD] rounded-2xl px-5 py-4 hover:bg-[#DDD6FE] transition-colors group fade-up"
                >
                    <div>
                        <p className="font-semibold text-[#7C3AED] text-sm">View Clinic Dashboard</p>
                        <p className="text-xs text-[#7C6F9A] mt-0.5">Patient adherence overview and dose history</p>
                    </div>
                    <svg className="w-5 h-5 text-[#7C3AED] group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </Link>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <svg className="animate-spin w-8 h-8 text-[#7C3AED]" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {METRICS.map((m) => (
                            <MetricCard key={m.label} {...m} />
                        ))}
                    </div>
                )}

                <div className="bg-[#FFF9F7] rounded-2xl border border-[#E9E0F8] p-6 shadow-sm fade-up">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                            {shieldIcon}
                        </div>
                        <div>
                            <h2 className="font-semibold text-[#1E1033]">Verify Clinic Staff Account</h2>
                            <p className="text-sm text-[#7C6F9A] mt-0.5">
                                Clinic staff cannot log in until an admin verifies their account. Paste the user UUID below.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Paste user UUID here..."
                            value={verifyId}
                            onChange={(e) => { setVerifyId(e.target.value); setVerifyMsg(null); setVerifyErr(null); }}
                            className="flex-1 border border-[#E9E0F8] rounded-xl px-4 py-2.5 text-sm text-[#1E1033] bg-[#FDFCFB] placeholder-[#7C6F9A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                        />
                        <button
                            onClick={handleVerify}
                            disabled={verifying || !verifyId.trim()}
                            className="bg-[#7C3AED] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#6D28D9] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {verifying ? 'Verifying...' : 'Verify'}
                        </button>
                    </div>

                    {verifyMsg && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {verifyMsg}
                        </div>
                    )}
                    {verifyErr && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-[#9F1239] bg-[#FFF1F2] border border-[#FDA4AF] rounded-xl px-4 py-2.5">
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {verifyErr}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const patientIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const caregiverIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>;
const staffIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
const medIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
const checkIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const missIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>;
const alertIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path strokeLinecap="round" d="M13.73 21a2 2 0 01-3.46 0" /></svg>;
const unreadIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
const shieldIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;