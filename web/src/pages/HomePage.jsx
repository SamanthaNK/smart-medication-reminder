import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';

function AsteriskLogo({ size = 52 }) {
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

const PILLARS = [
    {
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        ),
        label: 'Voice Reminders',
        desc: 'Spoken aloud at every dose. Works offline.',
    },
    {
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
        label: 'Morning Briefing',
        desc: 'Full day plan read aloud every morning at 7 AM.',
    },
    {
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
        label: 'Caregiver Alerts',
        desc: 'Instant push when a patient misses a dose.',
    },
    {
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
        label: 'Risk Scoring',
        desc: 'Weekly adherence tiers guide clinic follow-up.',
    },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#FDF6EE]">
            <div className="fixed inset-0 pointer-events-none dot-bg opacity-40" />

            <div className="relative z-10">
                <NavBar variant="public" />

                <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                        <div className="flex-1 flex flex-col items-start">

                            <h1 className="font-display italic text-5xl md:text-6xl xl:text-7xl text-[#1E1033] leading-[1.08] mb-6">
                                Medication<br />
                                reminders for<br />
                                <span className="text-[#7C3AED]">you and your loved ones.</span>
                            </h1>

                            <p className="text-base text-[#7C6F9A] leading-relaxed mb-8 max-w-sm">
                                MedMate helps patients across Cameroon stay on schedule with voice reminders,
                                offline-first design, and real-time caregiver alerts — all in one app.
                            </p>

                            <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">

                                <a href="/medmate.apk"
                                    className="inline-flex items-center gap-2 bg-[#7C3AED] text-white font-semibold text-sm px-6 py-3.5 rounded-full hover:bg-[#6D28D9] transition-all shadow-md shadow-violet-200"
                                >
                                    Download for Android
                                </a>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E1033] px-6 py-3.5 rounded-full border border-[#D4C8B8] hover:bg-white transition-all"
                                >
                                    Clinic staff login
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 w-full flex justify-center lg:justify-end">
                            <div className="relative w-full max-w-lg">
                                <div className="absolute inset-8 bg-[#7C3AED]/10 rounded-3xl blur-3xl" />
                                <img
                                    src="/app-art.png"
                                    alt="MedMate clinic dashboard"
                                    className="relative z-10 w-full"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-6xl mx-auto px-6 pb-24">
                    <div className="border-t border-[#E9E0D8] mb-12" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {PILLARS.map((p) => (
                            <div
                                key={p.label}
                                className="bg-[#FFF9F7] rounded-2xl border border-[#E9E0D8] p-5 hover:shadow-sm transition-shadow"
                            >
                                <div className="w-8 h-8 rounded-lg bg-[#FDF6EE] border border-[#E9E0D8] text-[#7C3AED] flex items-center justify-center mb-3">
                                    {p.icon}
                                </div>
                                <p className="font-semibold text-[#1E1033] text-sm mb-1">{p.label}</p>
                                <p className="text-xs text-[#7C6F9A] leading-relaxed">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <footer className="border-t border-[#E9E0D8] bg-[#FDF6EE]">
                    <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="flex items-center gap-2">
                            <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="24" fill="#7C3AED" />
                                <text x="24" y="24" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="26" fontFamily="system-ui" fontWeight="700">✱</text>
                            </svg>
                            <span className="font-display text-[#1E1033] text-sm">MedMate</span>
                        </div>
                        <p className="text-xs text-[#7C6F9A]">Smart Medication Reminder</p>
                        <Link to="/login" className="text-xs text-[#7C3AED] font-medium hover:underline">
                            Staff Portal
                        </Link>
                    </div>
                </footer>
            </div >
        </div >
    );
}