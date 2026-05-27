export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            <nav className="px-6 py-5 flex justify-between items-center border-b border-gray-100 max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center">
                        <span className="text-white font-bold">M</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">MedMate</span>
                </div>

                <a
                    href="/login"
                    className="text-sm text-violet-600 font-semibold hover:underline"
                >
                    Staff Login
                </a>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-20 text-center">
                <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                    Smart Medication Reminders<br />for Cameroon
                </h1>
                <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                    MedMate helps patients take their medication on time with voice reminders,
                    morning briefings, and automatic caregiver alerts when doses are missed.
                </p>


                <a
                    href="/medmate.apk"
                    className="inline-block bg-violet-600 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-violet-700 transition shadow-lg"
                >
                    Download Android App (APK)
                </a>

                <div className="mt-24 grid md:grid-cols-3 gap-8 text-left">
                    {[
                        {
                            title: 'Voice Reminders',
                            desc: 'The app speaks your medication name and dose aloud at the scheduled time. Works offline.',
                        },
                        {
                            title: 'Morning Briefing',
                            desc: 'Every morning at 7 AM, hear a complete summary of all medications scheduled for the day.',
                        },
                        {
                            title: 'Caregiver Alerts',
                            desc: 'When a dose is missed, the caregiver receives an instant push notification with the reason.',
                        },
                        {
                            title: 'Visual Medication Card',
                            desc: 'See the pill colour, shape, and dose on screen at reminder time to prevent confusion.',
                        },
                        {
                            title: 'Works Offline',
                            desc: 'Core reminders are scheduled locally on the device. No internet connection required.',
                        },
                        {
                            title: 'Risk Scoring',
                            desc: 'Weekly adherence scores and risk tiers help clinic staff identify patients who need follow-up.',
                        },
                    ].map((f) => (
                        <div key={f.title} className="border border-gray-200 rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="border-t border-gray-100 px-6 py-8 text-center text-gray-400 text-sm mt-20">
                MedMate — Smart Medication Reminder System
            </footer>
        </div>
    );
}