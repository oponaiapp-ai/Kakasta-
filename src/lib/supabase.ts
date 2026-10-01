import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://hanykwqmarplohslkdka.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_GgFI5OnBdNGmK6CBpI2gzg_Z_HONHhH';

export const supabase = createClient(url, key);
