import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type MessageKind = 'success' | 'error';

interface Message {
  kind: MessageKind;
  text: string;
}

const buttonBase: CSSProperties = {
  minHeight: '44px',
  padding: '12px 24px',
  borderRadius: 'var(--radius-pill)',
  fontWeight: 600,
  fontSize: '16px',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const dangerButton: CSSProperties = {
  ...buttonBase,
  background: 'transparent',
  border: '1px solid var(--color-danger)',
  color: 'var(--color-danger)',
};

const secondaryButton: CSSProperties = {
  ...buttonBase,
  background: 'transparent',
  border: '1px solid var(--color-border)',
  color: 'var(--color-fg)',
};

export default function AccountPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setMessage(null);
    try {
      await apiFetch<void>('/api/users/me', { method: 'DELETE' });
      logout();
      setMessage({ kind: 'success', text: 'Dein Konto wurde gelöscht.' });
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : 'Das Konto konnte nicht gelöscht werden.';
      setMessage({ kind: 'error', text });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <section>
      <h1>Konto</h1>

      {message && (
        <div
          role={message.kind === 'error' ? 'alert' : 'status'}
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${
              message.kind === 'success'
                ? 'var(--color-success)'
                : 'var(--color-danger)'
            }`,
            color:
              message.kind === 'success'
                ? 'var(--color-success)'
                : 'var(--color-danger)',
            backgroundColor:
              message.kind === 'success'
                ? 'rgba(79, 157, 107, 0.12)'
                : 'rgba(201, 79, 79, 0.12)',
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Konto löschen</h2>
        <p style={{ color: 'var(--color-muted)' }}>
          Wenn du dein Konto löschst, werden alle zugehörigen Kleidungsstücke
          und Outfits dauerhaft entfernt. Dieser Schritt kann nicht rückgängig
          gemacht werden.
        </p>
        <button
          type="button"
          style={dangerButton}
          onClick={() => setConfirmOpen(true)}
          disabled={deleting}
        >
          Konto löschen
        </button>
      </div>

      {confirmOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--color-overlay)',
          }}
          onClick={() => {
            if (!deleting) {
              setConfirmOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-confirm-title" style={{ marginTop: 0, fontSize: '20px' }}>
              Konto wirklich löschen?
            </h2>
            <p style={{ color: 'var(--color-muted)' }}>
              Diese Aktion löscht dein Konto und alle zugehörigen Daten
              dauerhaft.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={secondaryButton}
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                type="button"
                style={dangerButton}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Löschen…' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
