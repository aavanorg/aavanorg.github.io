const AAVAN_SUPABASE_URL = 'https://iefjlkuldbzgrmwbqhvf.supabase.co';
const AAVAN_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TFoL4XU_HQVx57FkwSZVrg_mNyH9L_2';

const aavanSupabase = window.supabase.createClient(
  AAVAN_SUPABASE_URL,
  AAVAN_SUPABASE_PUBLISHABLE_KEY
);

window.AAVAN = window.AAVAN || {};
window.AAVAN.supabase = aavanSupabase;
window.AAVAN.supabaseUrl = AAVAN_SUPABASE_URL;
