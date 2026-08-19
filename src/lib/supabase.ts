import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://beuzyqudahxusphhbtqh.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJldXp5cXVkYWh4dXNwaGh icGJ0cWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTc4NDYsImV4cCI6MjA5NTg4Mzg0Nn0.6KvHBFH5GTQvMEiOdNgW-fi0rSpYNC6i-_khiHl_4uo'.replace(' ', '');

export const isSupabaseConfigured = true;
export const supabase = createClient(supabaseUrl, supabaseKey);
export const makeCode = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');
