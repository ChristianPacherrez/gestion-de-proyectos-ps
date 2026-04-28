import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación: verifica que las variables existan antes de conectar
console.log('[Supabase] URL:', supabaseUrl ?? '❌ no definida')
console.log('[Supabase] Key:', supabaseKey ? '✅ definida' : '❌ no definida')

if (!supabaseUrl || supabaseUrl === 'REEMPLAZAR_URL') {
  console.error(
    '[Supabase] VITE_SUPABASE_URL no está configurada.\n' +
    'Edita .env.local y agrega tu Project URL de Supabase.'
  )
}

if (!supabaseKey || supabaseKey === 'REEMPLAZAR_KEY') {
  console.error(
    '[Supabase] VITE_SUPABASE_ANON_KEY no está configurada.\n' +
    'Edita .env.local y agrega tu anon/public key de Supabase.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
