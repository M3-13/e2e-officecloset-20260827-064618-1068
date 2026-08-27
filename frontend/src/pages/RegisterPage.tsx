import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import './auth.css';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unbekannter Fehler. Bitte erneut versuchen.';
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password);
      navigate('/wardrobe', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Registrieren</h1>
        <p className="auth-subtitle">
          Erstelle dein Konto und betrete die Garderobe.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="register-email">
              E-Mail
            </label>
            <input
              id="register-email"
              className="form-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="register-password">
              Passwort
            </label>
            <input
              id="register-password"
              className="form-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              required
            />
          </div>

          {error ? (
            <p className="auth-banner" role="alert">
              {error}
            </p>
          ) : null}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Konto wird erstellt …' : 'Registrieren'}
          </button>
        </form>

        <p className="auth-alt">
          Schon ein Konto? <Link to="/login">Anmelden</Link>
        </p>
      </div>
    </div>
  );
}
