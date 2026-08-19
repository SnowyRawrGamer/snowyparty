import { createClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase throws during module initialization when either value is empty. Use
// a harmless valid client configuration so the landing UI can still render in
// previews and GitHub Pages builds that do not provide environment variables.
const supabaseUrl = configuredUrl || 'https://placeholder.supabase.co';
const supabaseKey = configuredKey || 'public-anon-key-placeholder';

export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey);
export const supabase = createClient(supabaseUrl, supabaseKey);

export const makeCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
