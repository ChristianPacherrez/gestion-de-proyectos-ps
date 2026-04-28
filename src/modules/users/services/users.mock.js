/**
 * Mock contacts — datos de ejemplo para la sección Contactos.
 * type: 'collaborator' | 'client'  (los contactos nunca son owners)
 */
export const MOCK_USERS = [
  {
    id:       'u2',
    name:     'María López',
    initials: 'ML',
    role:     'collaborator',
    type:     'collaborator',
    email:    'maria@empresa.com',
    status:   'active',
  },
  {
    id:       'u3',
    name:     'Andrés Ríos',
    initials: 'AR',
    role:     'collaborator',
    type:     'collaborator',
    email:    'andres@empresa.com',
    status:   'active',
  },
  {
    id:       'u4',
    name:     'Julia Vargas',
    initials: 'JV',
    role:     'client',
    type:     'client',
    email:    'julia@cliente.com',
    status:   'active',
  },
];
