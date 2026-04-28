import { useState } from 'react';
import { useUsers }                from '../hooks/useUsers';
import { UserCard, UserFormModal } from '../components';

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const [modalContact, setModalContact] = useState(null); // null | 'new' | {contact}

  const contacts  = users;
  const isEdit    = modalContact !== null && modalContact !== 'new';
  const modalOpen = modalContact !== null;

  async function handleSubmit(contact) {
    if (isEdit) {
      // Edición: solo se puede cambiar el alias (name)
      await updateUser(contact.id, { name: contact.name });
    } else {
      await addUser(contact);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#101828' }}>Contactos</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#475467' }}>
            {contacts.length} contacto{contacts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModalContact('new')}
          style={{
            padding: '8px 14px', borderRadius: '8px',
            border: '1px solid #6941c6', backgroundColor: '#7f56d9',
            color: '#fff', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
        >
          + Invitar contacto
        </button>
      </div>

      {/* Contact list */}
      {contacts.length === 0 ? (
        <div style={{
          padding: '56px 32px', textAlign: 'center',
          backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaecf0',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 500, color: '#344054' }}>
            Sin contactos aún
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#98a2b3' }}>
            Agrega un contacto por email para empezar a invitarlo a proyectos.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {contacts.map((contact) => (
            <UserCard
              key={contact.id}
              user={contact}
              onEdit={(c) => setModalContact(c)}
              onDelete={deleteUser}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <UserFormModal
          initialUser={isEdit ? modalContact : null}
          onClose={() => setModalContact(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
