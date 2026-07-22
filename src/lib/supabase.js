import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(url && key);
export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
export const usernameToEmail = (username) =>
  username.includes("@")
    ? username
    : `${username.trim().toLowerCase()}@cipl.lk`;
export const supabasePublishableKey = key;
export const resumableStorageEndpoint = isSupabaseConfigured
  ? `${url.replace(".supabase.co", ".storage.supabase.co")}/storage/v1/upload/resumable`
  : "";
