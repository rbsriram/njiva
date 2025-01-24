// src/lib/supabaseClient.ts

console.log("--------------------/lib/supabaseClient.ts Component Mounted-----------------------");
import { createClient } from '@supabase/supabase-js';

// Environment variables from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

