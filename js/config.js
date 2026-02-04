const SUPABASE_URL = "https://auwhdogziigvrmvtghhr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hkb2d6aWlndnJtdnRnaGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDY0MzAsImV4cCI6MjA4NTI4MjQzMH0.LQIs45yzYGLMaYN_W7J-owGR5ZQELFuYIWN9csSPIOY";

if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
