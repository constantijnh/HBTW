const SUPABASE_URL = 'https://kroelruadivbicuytlnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyb2VscnVhZGl2YmljdXl0bG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTQxNTMsImV4cCI6MjEwNTY3MDE1M30.50u3BUeH85cmtFl6wX6X5phyeOzeblWoR0EkI_zGQMc';

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
