import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function AsteriskLogo({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="24" fill="#7C3AED" />
            <text
                x="24" y="23"
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize="30"
                fontFamily="system-ui, sans-serif"
                fontWeight="700"
            >✱</text>
        </svg>
    );
}

export default function NavBar({ variant = 'app' }) {
    const { user, clearSession } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = () => {
        clearSession();
        navigate('/login');
    };

    if (variant === 'public') {
        return (
            <nav className="sticky top-0 z-50 bg-[#FDF6EE]/90 backdrop-blur-md border-b border-[#E9E0D8]">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2.5">
                        <AsteriskLogo size={30} />
                        <span className="font-display italic text-xl text-[#1E1033]">MedMate</span>
                    </Link>
                    <Link
                        to="/login"
                        className="text-sm font-semibold text-[#7C3AED] hover:bg-[#EDE9FE] px-5 py-2 rounded-full border border-[#C4B5FD] transition-colors"
                    >
                        Staff Login
                    </Link>
                </div>
            </nav>
        );
    }

    const isAdmin = user?.role === 'admin';

    return (
        <nav className="sticky top-0 z-50 bg-[#FDF6EE] border-b border-[#E9E0D8]">
            <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-2.5">
                        <AsteriskLogo size={28} />
                        <span className="font-display italic text-[#1E1033] text-lg">MedMate</span>
                    </Link>
                    <div className="hidden sm:flex items-center gap-1">
                        {isAdmin && (
                            <NavLink to="/clinic" active={location.pathname === '/clinic'}>
                                Clinic
                            </NavLink>
                        )}
                        <NavLink
                            to={isAdmin ? '/admin' : '/clinic'}
                            active={location.pathname === (isAdmin ? '/admin' : '/clinic')}
                        >
                            {isAdmin ? 'Admin' : 'Dashboard'}
                        </NavLink>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 bg-[#FFF9F7] rounded-full px-3 py-1.5 border border-[#E9E0D8]">
                        <div className="w-6 h-6 rounded-full bg-[#7C3AED] flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                                {(user?.name || 'U')[0].toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm font-medium text-[#1E1033]">{user?.name}</span>
                        <span className="text-xs text-[#7C6F9A] bg-[#FDF6EE] px-2 py-0.5 rounded-full border border-[#E9E0D8]">
                            {user?.role?.replace('_', ' ')}
                        </span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="text-sm font-semibold text-[#9F1239] hover:bg-[#FFF1F2] px-3 py-1.5 rounded-full border border-[#FDA4AF] transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ to, active, children }) {
    return (
        <Link
            to={to}
            className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${active
                    ? 'bg-[#EDE9FE] text-[#7C3AED]'
                    : 'text-[#7C6F9A] hover:text-[#1E1033] hover:bg-white'
                }`}
        >
            {children}
        </Link>
    );
}