import { createClient } from "@supabase/supabase-js"

// Service role client pour actions admin (create campaign, evaluations, etc.)
export const supabaseAdminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
