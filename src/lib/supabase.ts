import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL ?? '', import.meta.env.VITE_SUPABASE_ANON_KEY ?? '');
export const makeCode = () => { const chars='ABCDEFGHJKLMNPQRSTUVWXYZ'; return Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join(''); };
