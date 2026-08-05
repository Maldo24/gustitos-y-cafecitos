import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-butter-500 shadow px-6 py-4 shrink-0 flex justify-between items-center z-10">
      <Link to="/" className="hover:opacity-80 transition-opacity">
        <h1 className="text-2xl font-bold text-butter-100">Gustitos y Cafecitos</h1>
      </Link>
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </div>
        ) : (<div></div>)}
      </div>
    </header>
  );
}

export default Navbar;