import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navLinks = [
  { to: '/wardrobe', label: 'Garderobe' },
  { to: '/outfits', label: 'Outfits' },
  { to: '/konto', label: 'Konto' },
  { to: '/impressum', label: 'Impressum' },
  { to: '/datenschutz', label: 'Datenschutz' },
];

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/wardrobe" className="brand">
          Vestiaire
        </Link>
        <nav className="nav" aria-label="Hauptnavigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <button
              type="button"
              className="nav-link nav-action"
              onClick={logout}
            >
              Logout
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
