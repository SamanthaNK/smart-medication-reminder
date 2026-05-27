const config = {
    green:  { label: 'Green',  bg: 'bg-green-100',  text: 'text-green-800' },
    amber:  { label: 'Amber',  bg: 'bg-yellow-100', text: 'text-yellow-800' },
    red:    { label: 'Red',    bg: 'bg-red-100',    text: 'text-red-800' },
};

export default function RiskBadge({ tier }) {
    if (!tier) return <span className="text-gray-400 text-xs">No data</span>;
    const { label, bg, text } = config[tier] || {};
    return (
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${bg} ${text}`}>
            {label}
        </span>
    );
}