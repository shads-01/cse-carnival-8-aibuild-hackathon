import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { envConfig } from '../config/env.config';

export const supabaseClient: SupabaseClient = createClient(
  envConfig.supabaseUrl,
  envConfig.supabaseAnonKey
);
