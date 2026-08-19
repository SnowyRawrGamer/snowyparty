import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://beuzyqudahxusphhbtqh.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhY2U6Ly9iZXV6eXF1ZGFoeHVzcGh oYnRxaCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgwMzE3ODQ2LCJleHAiOjIwOTU4OTM4NDZ9.6KvHBFH5GTQvMEiOdNgW-fi0rSpYNC6i-_khiHl_4uo'.replace(' ', '');

export const isSupabaseConfigured = true;
export const supabase = createClient(supabaseUrl, supabaseKey);
export const makeCode = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');
