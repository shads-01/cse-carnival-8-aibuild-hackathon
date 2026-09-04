export const envConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://jmafhkowkmkobubpwgdu.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  approvalMode: import.meta.env.VITE_APPROVAL_MODE !== 'false'
};
