import { createClient } from './supabase/client';

// Re-export browser client for backward compatibility
export const supabase = createClient();
