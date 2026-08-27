import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">Vestiaire</span>
        <nav className="footer-nav" aria-label="Fußnavigation">
          <Link to="/impressum">Impressum</Link>
          <Link to="/datenschutz">Datenschutz</Link>
        </nav>
      </div>
    </footer>
  );
}
