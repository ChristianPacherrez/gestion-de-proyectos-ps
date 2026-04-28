import React from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Iniciales del avatar:
 *   1. Alias → primeras letras de cada palabra (máx. 2)
 *   2. Sin alias → primera letra del prefijo del email
 */
function getInitials(name, email) {
  if (name?.trim()) {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
  }
  return (email?.split('@')[0]?.[0] ?? '?').toUpperCase();
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({ onClick, title, danger, children }) {
  return (
    <button
      type="button" onClick={onClick} title={title} aria-label={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px', borderRadius: '6px',
        border: '1px solid #eaecf0', backgroundColor: '#fff',
        color: danger ? '#f04438' : '#667085', cursor: 'pointer',
        transition: 'background-color 0.1s, border-color 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger ? '#fff1f0' : '#f9fafb';
        e.currentTarget.style.borderColor     = danger ? '#fca5a5' : '#d0d5dd';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#fff';
        e.currentTarget.style.borderColor     = '#eaecf0';
      }}
    >
      {children}
    </button>
  );
}

// ─── ContactCard ──────────────────────────────────────────────────────────────
/**
 * Props:
 *   user     — { id, name (alias, optional), email, contact_user_id, status }
 *   onEdit   — (user)
 *   onDelete — (userId)
 */
export default function UserCard({ user, onEdit, onDelete }) {
  const { id, name, email } = user;
  const initials = getInitials(name, email);
  const displayLabel = email || '(sin email)';

  const [copied, setCopied] = React.useState(false);

  function handleCopyEmail() {
    if (!email) return;
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {/* clipboard not available */});
  }

  function handleDelete() {
    const label = name?.trim() ? `"${name}"` : `"${email}"`;
    if (window.confirm(`¿Eliminar el contacto ${label}?`)) onDelete(id);
  }

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #eaecf0',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d0d5dd'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eaecf0'; }}
    >
      {/* Avatar */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
        backgroundColor: '#f4f3ff', border: '1.5px solid #e9d7fe',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 700, color: '#6941c6',
        userSelect: 'none',
      }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Email + badge de pendiente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '14px', fontWeight: 500, color: '#101828',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayLabel}
          </span>
          {user.status === 'pending' && (
            <span style={{
              flexShrink: 0,
              padding: '1px 7px', borderRadius: '9999px',
              fontSize: '11px', fontWeight: 500,
              backgroundColor: '#fffaeb', color: '#b54708', border: '1px solid #fedf89',
            }}>
              Pendiente
            </span>
          )}
        </div>

        {/* Alias — línea secundaria, solo si existe */}
        {name?.trim() && (
          <div style={{
            fontSize: '12px', color: '#98a2b3', marginTop: '2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {email && (
          <ActionBtn
            onClick={handleCopyEmail}
            title={copied ? 'Email copiado' : 'Copiar email'}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </ActionBtn>
        )}
        <ActionBtn onClick={() => onEdit(user)} title="Editar alias">
          <PencilIcon />
        </ActionBtn>
        <ActionBtn onClick={handleDelete} title="Eliminar contacto" danger>
          <TrashIcon />
        </ActionBtn>
      </div>
    </div>
  );
}
