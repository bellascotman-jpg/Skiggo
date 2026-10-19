// Public browser configuration only. The publishable key is intentionally public;
// Row Level Security and database grants are the security boundary. Never add a service-role key here.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://toqxucfvvufcqcdkmsim.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_-oVeKa8SIKzBRQIoI2s3Xw_xPq1iSte";
