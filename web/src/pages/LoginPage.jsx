import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api';
import { useAuthStore } from '../store/authStore';

function AsteriskLogo({ size = 48 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="24" fill="#7C3AED" />
            <text
                x="24" y="25"
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize="26"
                fontFamily="system-ui, sans-serif"
                fontWeight="700"
            >✱</text>
        </svg>
    );
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { setSession } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await login(email.trim().toLowerCase(), password);

            if (!['clinic_staff', 'admin'].includes(data.user.role)) {
                setError('This portal is for clinic staff and administrators only. Please use the mobile app to register as a patient or caregiver.');
                return;
            }

            setSession(data.token, data.user);
            navigate(data.user.role === 'admin' ? '/admin' : '/clinic');
        } catch (err) {
            if (err.errorCode === 'PENDING_ADMIN_VERIFICATION') {
                setError('Your account is pending administrator approval. Please contact your clinic administrator.');
            } else if (err.errorCode === 'INVALID_CREDENTIALS') {
                setError('Incorrect email or password.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#FDF6EE]">
            <div className="fixed inset-0 pointer-events-none dot-bg opacity-40" />

            <div className="hidden lg:flex flex-1 bg-[#7C3AED] relative overflow-hidden flex-col justify-between p-14">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full" />
                    <div className="absolute bottom-20 right-5 w-96 h-96 bg-white/5 rounded-full" />
                    <div className="absolute top-1/3 left-1/2 w-48 h-48 bg-white/5 rounded-full" />
                </div>

                <div className="relative z-10" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="flex flex-col items-center gap-4">
                        <svg width="80" height="80" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="24" fill="rgba(255,255,255,0.15)" />
                            <text x="24" y="23" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="40" fontFamily="system-ui" fontWeight="700">✱</text>
                        </svg>
                        <span className="font-display italic text-white text-5xl">MedMate</span>
                    </div>
                </div>

                <div className="relative z-10 p-4">
                    <p className="text-white/90 text-xs leading-relaxed">
                        <span className="font-semibold block mb-1">No registration here</span>
                        Clinic staff accounts are created through the mobile app and verified
                        by an administrator before access is granted.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-6 relative z-10">
                <div className="w-full max-w-sm">
                    <div className="flex lg:hidden flex-col items-center mb-10">
                        <Link to="/" className="flex flex-col items-center gap-3">
                            <AsteriskLogo size={48} />
                            <span className="font-display italic text-2xl text-[#1E1033]">MedMate</span>
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 mb-8">
                        <Link to="/" className="flex items-center gap-2 text-sm text-[#7C6F9A] hover:text-[#1E1033] transition-colors">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to site
                        </Link>
                    </div>

                    <h1 className="text-2xl font-bold text-[#1E1033] mb-1">Welcome back</h1>
                    <p className="text-sm text-[#7C6F9A] mb-8">Sign in to your clinic account</p>

                    {error && (
                        <div className="flex items-start gap-2.5 bg-[#FFF1F2] border border-[#FDA4AF] text-[#9F1239] text-sm rounded-xl px-4 py-3 mb-6">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#1E1033] mb-1.5 uppercase tracking-wide">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@clinic.cm"
                                className="w-full border border-[#E9E0D8] rounded-xl px-4 py-3 text-sm text-[#1E1033] placeholder-[#B8B0CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#1E1033] mb-1.5 uppercase tracking-wide">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full border border-[#E9E0D8] rounded-xl px-4 py-3 pr-11 text-sm text-[#1E1033] placeholder-[#B8B0CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B0CC] hover:text-[#1E1033] transition-colors"
                                    aria-label={showPw ? 'Hide password' : 'Show password'}
                                >
                                    {showPw ? (
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#7C3AED] text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-[#6D28D9] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1 shadow-md shadow-violet-200"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign in'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-[#7C6F9A] mt-6">
                        Not staff?{' '}
                        <a href="/medmate.apk" className="text-[#7C3AED] font-medium hover:underline">
                            Download the patient app
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}