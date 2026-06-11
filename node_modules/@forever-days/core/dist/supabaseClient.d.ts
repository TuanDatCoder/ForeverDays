export declare const SupabaseConfig: {
    url: string;
    anonKey: string;
};
declare let _supabaseInstance: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export type SupabaseClientType = typeof _supabaseInstance;
export declare const supabase: SupabaseClientType;
export declare const setSupabaseStorage: (storage: any) => void;
export declare const CosmosSupabaseConfig: {
    url: string;
    anonKey: string;
};
export declare const cosmosSupabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export {};
