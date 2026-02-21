import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iagidklkqlinbfrqltny.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZ2lka2xrcWxpbmJmcnFsdG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODIyMzYsImV4cCI6MjA4NzI1ODIzNn0.MX-E62iLiO1trJxHH5s4tHyof2RRZM7SqslJxG4fbtc'

export const supabase = createClient(supabaseUrl, supabaseKey)
