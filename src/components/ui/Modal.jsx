/**
 * Modal — bridge component
 *
 * API mirrors Untitled UI's modal pattern (ModalOverlay + Modal + Dialog).
 * Replaces the recurring inline backdrop+card pattern in every modal component.
 *
 * Usage:
 *   <Modal isOpen={show} onClose={handleClose} title="Nueva tarea" description="…">
 *     <form onSubmit={handleSubmit}>
 *       …fields…
 *       <Modal.Footer>
 *         <Button color="secondary" onClick={handleClose}>Cancelar</Button>
 *         <Button color="primary" type="submit">Guardar</Button>
 *       </Modal.Footer>
 *     </form>
 *   </Modal>
 *
 * Props
 *   isOpen      boolean
 *   onClose     () => void
 *   title?      string
 *   description? string
 *   maxWidth?   string   (default "520px")
 *   children    ReactNode
 */

import { useEffect } from 'react';

// ─── Modal.Footer ─────────────────────────────────────────────────────────────
function ModalFooter({ children }) {
  return (
    <div style={{
      display:         'flex',
      justifyContent:  'flex-end',
      alignItems:      'center',
      gap:             '10px',
      padding:         '16px 24px',
      borderTop:       '1px solid #eaecf0',
      backgroundColor: '#f9fafb',
    }}>
      {children}
    </div>
  );
}

// ─── CloseButton ──────────────────────────────────────────────────────────────
function CloseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Cerrar"
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           '32px',
        height:          '32px',
        borderRadius:    '8px',
        border:          'none',
        backgroundColor: 'transparent',
        color:           '#98a2b3',
        cursor:          'pointer',
        transition:      'background-color 0.1s, color 0.1s',
        flexShrink:      0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f4f7'; e.currentTarget.style.color = '#667085'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#98a2b3'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  maxWidth  = '520px',
  children,
}) {
  // Scroll lock
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position:        'fixed',
        inset:           0,
        backgroundColor: 'rgba(16,24,40,0.5)',
        backdropFilter:  'blur(2px)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        zIndex:          1000,
        padding:         '16px',
      }}
    >
      {/* Card */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius:    '16px',
        boxShadow:       '0px 24px 48px -12px rgba(0,0,0,0.18)',
        width:           '100%',
        maxWidth,
        overflow:        'hidden',
        display:         'flex',
        flexDirection:   'column',
      }}>

        {/* Header */}
        {(title || description) && (
          <>
            <div style={{
              display:         'flex',
              justifyContent:  'space-between',
              alignItems:      'flex-start',
              padding:         '20px 24px 0',
              gap:             '12px',
            }}>
              <div>
                {title && (
                  <h2 style={{
                    margin:     0,
                    fontSize:   '18px',
                    fontWeight: 600,
                    lineHeight: '28px',
                    color:      '#101828',
                  }}>
                    {title}
                  </h2>
                )}
                {description && (
                  <p style={{
                    margin:     '2px 0 0',
                    fontSize:   '14px',
                    lineHeight: '20px',
                    color:      '#475467',
                  }}>
                    {description}
                  </p>
                )}
              </div>
              <CloseButton onClick={onClose} />
            </div>
            <div style={{ height: '1px', backgroundColor: '#eaecf0', margin: '16px 0 0' }} />
          </>
        )}

        {/* Body */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

Modal.Footer = ModalFooter;

export default Modal;
