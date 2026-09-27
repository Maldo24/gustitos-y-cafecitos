import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const initials = (user?.names || user?.username || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="bg-butter-500 shadow-md sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-butter-100 text-butter-500 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3-1V6h-2a1 1 0 100 2M14 9l-3-1V6h2a1 1 0 110 2M7 10a2 2 0 100 4h1.5M10 10l2-1 2 1v2.5c0 1.4-1.6 2.5-3.9 2.5S7 13.9 7 12.5V10zM16 9a2 2 0 118 0v2c0 4-2.6 6-7 6" />
            </svg>
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-butter-100 tracking-tight leading-none group-hover:opacity-80 transition-opacity">
            Gustitos y Cafecitos
          </span>
        </div>

        {user ? (
          <>
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/dashboard"
                className="text-butter-100 font-bold hover:bg-butter-400/30 px-3 py-2 rounded-lg transition-colors"
              >
                Mis Grupos
              </Link>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="text-butter-100 font-bold hover:bg-butter-400/30 px-3 py-2 rounded-lg transition-colors"
                >
                  Admin
                </Link>
              )}
              <Button variant="light" onClick={handleLogout} className="py-2">
                Cerrar Sesión
              </Button>
              <div className="flex items-center gap-2.5 bg-butter-100/90 border border-butter-300 rounded-full py-1 pl-1 pr-3 ml-1">
                <span className="w-8 h-8 rounded-full bg-butter-500 text-butter-100 font-extrabold flex items-center justify-center shadow-sm">
                  {initials}
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-sm font-extrabold text-butter-500">{user.names || user.username}</span>
                  <span className="text-xs font-semibold text-butter-400">@{user.username}</span>
                </span>
              </div>
            </div>

            {/* Mobile */}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-butter-100 hover:bg-butter-400/30 transition-colors"
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </>
        ) : (
          <span className="text-butter-200 text-sm font-semibold hidden sm:inline">Buen café, mejor compañía</span>
        )}
      </div>

      {/* Mobile dropdown */}
      {user && menuOpen && (
        <div className="md:hidden bg-butter-500 border-t border-butter-400/50 shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-butter-400/25 border border-butter-300/60 rounded-2xl p-3">
              <span className="w-11 h-11 rounded-full bg-butter-100 text-butter-500 font-extrabold text-lg flex items-center justify-center shadow-sm">
                {initials}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-extrabold text-butter-100">{user.names || user.username}</span>
                <span className="text-sm font-semibold text-butter-200">@{user.username}</span>
              </span>
            </div>
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="text-butter-100 font-bold hover:bg-butter-400/30 px-3 py-2.5 rounded-lg transition-colors"
            >
              Mis Grupos
            </Link>
            {user.role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="text-butter-100 font-bold hover:bg-butter-400/30 px-3 py-2.5 rounded-lg transition-colors"
              >
                Panel de Admin
              </Link>
            )}
            <Button variant="light" onClick={handleLogout} className="w-full">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;