const CONFIG = {
    green: { label: 'On Track', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    amber: { label: 'At Risk', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    red: { label: 'High Risk', dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
};

export default function RiskBadge({ tier }) {
    if (!tier) {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                No data
            </span>
        );
    }
    const { label, dot, bg, text, border } = CONFIG[tier] || CONFIG.red;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${bg} ${text} ${border}`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${dot}`} />
            {label}
        </span>
    );
}