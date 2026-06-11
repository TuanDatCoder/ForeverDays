import { createClient } from '@supabase/supabase-js';

export const SupabaseConfig = {
  url: 'https://cigigyfpiadyabyrbujc.supabase.co',
  anonKey: 'sb_publishable_OvwP_BkKRKP3_pdn0n1y8g_bWNRkvxy',
};

let _supabaseInstance = createClient(SupabaseConfig.url, SupabaseConfig.anonKey);
export type SupabaseClientType = typeof _supabaseInstance;

export const supabase = new Proxy({}, {
  get: (target, prop) => {
    const value = (_supabaseInstance as any)[prop];
    return typeof value === 'function' ? value.bind(_supabaseInstance) : value;
  }
}) as SupabaseClientType;

export const setSupabaseStorage = (storage: any) => {
  _supabaseInstance = createClient(SupabaseConfig.url, SupabaseConfig.anonKey, {
    auth: {
      storage: storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    }
  });
};

export const CosmosSupabaseConfig = {
  url: 'https://dhfdllzdnemmrxubnldu.supabase.co',
  anonKey: 'sb_publishable_vWH7568dUs0VSjC5YoY1fA_aEWIpOpW',
};

export const cosmosSupabase = createClient(CosmosSupabaseConfig.url, CosmosSupabaseConfig.anonKey);

