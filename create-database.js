import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationSQL = `
CREATE TABLE IF NOT EXISTS proxy_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_base_url text NOT NULL,
  proxy_url text NOT NULL,
  port integer DEFAULT 3001,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE proxy_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own proxy configs" ON proxy_configs;
CREATE POLICY "Users can view own proxy configs"
  ON proxy_configs FOR SELECT TO authenticated
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create own proxy configs" ON proxy_configs;
CREATE POLICY "Users can create own proxy configs"
  ON proxy_configs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own proxy configs" ON proxy_configs;
CREATE POLICY "Users can update own proxy configs"
  ON proxy_configs FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own proxy configs" ON proxy_configs;
CREATE POLICY "Users can delete own proxy configs"
  ON proxy_configs FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_proxy_configs_active ON proxy_configs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_proxy_configs_created_by ON proxy_configs(created_by);

CREATE OR REPLACE FUNCTION update_proxy_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_proxy_config_timestamp ON proxy_configs;
CREATE TRIGGER set_proxy_config_timestamp
  BEFORE UPDATE ON proxy_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_proxy_config_timestamp();
`;

async function runMigration() {
  try {
    console.log('Starting migration...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('Migration error:', error);

      const { data: testData, error: testError } = await supabase
        .from('proxy_configs')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Table does not exist:', testError);
        throw error;
      } else {
        console.log('✅ Table already exists and is accessible');
      }
    } else {
      console.log('✅ Migration completed successfully:', data);
    }

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

runMigration();
