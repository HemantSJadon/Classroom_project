import { createBrowserClient as _createBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

export function createBrowserClient() {
  return _createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
