// lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rvgfbbjclpaznfkfvcdl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z2ZiYmpjbHBhem5ma2Z2Y2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODUzMDksImV4cCI6MjA4OTE2MTMwOX0.NPUiVUqb_N5OCZpSIMpwKHU21rg-oDjjSxdPZSr421A";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});