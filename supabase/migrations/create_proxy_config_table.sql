/*
  # Create proxy server configuration table

  1. New Tables
    - `proxy_configs`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text) - Configuration name/label
      - `api_base_url` (text) - External API base URL (e.g., https://api.stefanmars.nl)
      - `proxy_url` (text) - Proxy server URL with credentials
      - `port` (integer) - Port number for proxy server
      - `is_active` (boolean) - Whether this configuration is currently active
      - `created_at` (timestamptz) - When the configuration was created
      - `updated_at` (timestamptz) - When the configuration was last updated
      - `created_by` (uuid) - User who created the configuration

  2. Security
    - Enable RLS on `proxy_configs` table
    - Add policies for authenticated users to manage proxy configurations

  3. Notes
    - Only one configuration can be active at a time
    - Proxy credentials should be encrypted in production
    - Users can only manage their own configurations
*/

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

CREATE POLICY "Users can view own proxy configs"
  ON proxy_configs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own proxy configs"
  ON proxy_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own proxy configs"
  ON proxy_configs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own proxy configs"
  ON proxy_configs
  FOR DELETE
  TO authenticated
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

CREATE TRIGGER set_proxy_config_timestamp
  BEFORE UPDATE ON proxy_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_proxy_config_timestamp();
