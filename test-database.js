import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lrkisjmhpdqqorlzonpi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2lzam1ocGRxcW9ybHpvbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MjQyODgsImV4cCI6MjA3NTQwMDI4OH0.CrQZ-_cihOzdMmLWX0hcwnCJfU2bU1hEssxcuz9_v-Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('Testing database connection...\n');

  const { data, error } = await supabase
    .from('proxy_configs')
    .select('*')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Connection successful!');
    console.log(`Found ${data.length} proxy configs:`, data);
  }
}

testDatabase();
