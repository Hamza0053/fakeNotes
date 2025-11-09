import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jnaskldcvgkqhsxjgneo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuYXNrbGRjdmdrcWhzeGpnbmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODU3NTIsImV4cCI6MjA3ODE2MTc1Mn0.WVLGsV4lb-RZKJCDwX4QHlT5CwKIuRbpoIaGRcjrtqc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
