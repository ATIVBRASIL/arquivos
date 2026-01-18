import { createClient } from '@supabase/supabase-js';

// Aqui o código busca as chaves que você colocou no arquivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Esse comando cria a conexão oficial
export const supabase = createClient(supabaseUrl, supabaseAnonKey);