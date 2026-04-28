import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  // Evita que el doble montaje de React Strict Mode configure dos listeners
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return   // Strict Mode: ignorar segundo montaje
    initialized.current = true

    // onAuthStateChange emite INITIAL_SESSION como primer evento —
    // eso cubre tanto "sesión existente" como "sin sesión".
    // getSession() se usa solo como fallback de seguridad en caso de que
    // el evento tarde o no llegue (raro, pero defensivo).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      // INITIAL_SESSION o cualquier primer evento cierra el loading.
      // Usar setLoading(false) aquí (no en getSession) para garantizar
      // que React actualiza user y loading en el mismo ciclo de render.
      setLoading(false)
    })

    // Fallback: si onAuthStateChange tarda más de 3s, desbloquear la UI
    // (p.ej. en navegadores con localStorage bloqueado).
    const timeout = setTimeout(() => setLoading(false), 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
      // Al desmontar en desarrollo (Strict Mode), permitir re-init
      initialized.current = false
    }
  }, [])

  // ── Auth actions ────────────────────────────────────────────────────────────

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) console.log('[Supabase] signIn error:', error)
    return { data, error }
  }

  async function signUp(email, password, metadata = {}) {
    const options = Object.keys(metadata).length > 0 ? { data: metadata } : undefined
    const { data, error } = await supabase.auth.signUp({ email, password, options })
    if (error) console.log('[Supabase] signUp error:', error)
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.log('[Supabase] signOut error:', error)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
