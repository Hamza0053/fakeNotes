import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pljuhfuxwhzxfggnvupz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsanVoZnV4d2h6eGZnZ252dXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTkzNzEsImV4cCI6MjA3NzkzNTM3MX0.BWQ7iKaJHedYaVbZHMkBwjREUbSoKYGEvMs1MXi5H-Y'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
