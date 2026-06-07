import { createClient } from '@supabase/supabase-js';

export const SupabaseConfig = {
  url: 'https://cigigyfpiadyabyrbujc.supabase.co',
  anonKey: 'sb_publishable_OvwP_BkKRKP3_pdn0n1y8g_bWNRkvxy',
};

export const supabase = createClient(SupabaseConfig.url, SupabaseConfig.anonKey);
export type SupabaseClientType = typeof supabase;
