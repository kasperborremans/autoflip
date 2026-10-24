import { localBackend } from './local'
import { supabase, supabaseBackend } from './supabase'

export { supabase }
export type { Backend } from './types'

/** Gedeelde database als Supabase is ingesteld, anders alleen in deze browser. */
export const backend = supabase ? supabaseBackend() : localBackend
