/*
  # Initial Database Schema

  1. New Tables
    - `users`
      - `id` (int, primary key, auto-increment)
      - `username` (varchar(100), unique, not null)
      - `email` (varchar(100), unique, not null)
      - `password_hash` (varchar(200), not null)
      - `token` (varchar(200), nullable)
      - `created_at` (timestamp, default now())
    
    - `agencies`
      - `id` (int, primary key, auto-increment)
      - `name` (varchar(100), unique, not null)
      - `address1` (varchar(255), not null)
      - `address2` (varchar(255), nullable)
      - `logo` (varchar(255), nullable)
      - `site_name` (varchar(100), nullable)
      - `site_prefix` (varchar(20), nullable)
      - `myhome_api_key` (varchar(100), nullable)
      - `myhome_group_id` (int, nullable)
      - `daft_api_key` (varchar(100), nullable)
      - `fourpm_branch_id` (int, nullable)
      - `unique_key` (varchar(255), nullable)
      - `office_name` (varchar(255), nullable)
      - `ghl_id` (varchar(255), nullable)
      - `whmcs_id` (varchar(255), nullable)
      - `created_at` (timestamp, default now())
    
    - `properties`
      - `id` (int, primary key, auto-increment)
      - `agency_agent_name` (varchar(100), not null)
      - `agency_name` (varchar(100), not null)
      - `house_location` (varchar(255), not null)
      - `house_price` (varchar(255), not null)
      - `house_bedrooms` (int, not null)
      - `house_bathrooms` (int, not null)
      - `house_mt_squared` (varchar(255), not null)
      - `house_extra_info_1` (varchar(255), nullable)
      - `house_extra_info_2` (varchar(255), nullable)
      - `house_extra_info_3` (varchar(255), nullable)
      - `house_extra_info_4` (varchar(255), nullable)
      - `agency_image_url` (varchar(255), nullable)
      - `images_url_house` (varchar(255), nullable)
      - `created_at` (timestamp, default now())
    
    - `connectors`
      - `id` (int, primary key, auto-increment)
      - `name` (varchar(255), unique, not null)
      - `connector_config_fields` (text, not null) - JSON string
      - `description` (text, nullable)
      - `type` (enum 'IN' or 'OUT', not null)
      - `created_at` (timestamp, default now())
    
    - `pipelines`
      - `id` (int, primary key, auto-increment)
      - `name` (varchar(255), not null)
      - `description` (text, nullable)
      - `pipelineURL` (varchar(2083), not null)
      - `created_at` (timestamp, default now())
    
    - `sites`
      - `id` (int, primary key, auto-increment)
      - `tag` (varchar(255), not null)
      - `site_id` (int, not null)
      - `value` (varchar(255), not null)
      - `created_at` (timestamp, default now())
    
    - `field_mappings`
      - `id` (int, primary key, auto-increment)
      - `field_name` (varchar(255), not null)
      - `acquaint_crm` (varchar(255), nullable)
      - `propertydrive` (varchar(255), nullable)
      - `daft` (varchar(255), nullable)
      - `myhome` (varchar(255), nullable)
      - `created_at` (timestamp, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for properties, agencies, connectors, pipelines
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username varchar(100) UNIQUE NOT NULL,
  email varchar(100) UNIQUE NOT NULL,
  password_hash varchar(200) NOT NULL,
  token varchar(200),
  created_at timestamptz DEFAULT now()
);

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id serial PRIMARY KEY,
  name varchar(100) UNIQUE NOT NULL,
  address1 varchar(255) NOT NULL,
  address2 varchar(255),
  logo varchar(255),
  site_name varchar(100),
  site_prefix varchar(20),
  myhome_api_key varchar(100),
  myhome_group_id int,
  daft_api_key varchar(100),
  fourpm_branch_id int,
  unique_key varchar(255),
  office_name varchar(255),
  ghl_id varchar(255),
  whmcs_id varchar(255),
  created_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id serial PRIMARY KEY,
  agency_agent_name varchar(100) NOT NULL,
  agency_name varchar(100) NOT NULL,
  house_location varchar(255) NOT NULL,
  house_price varchar(255) NOT NULL,
  house_bedrooms int NOT NULL,
  house_bathrooms int NOT NULL,
  house_mt_squared varchar(255) NOT NULL,
  house_extra_info_1 varchar(255),
  house_extra_info_2 varchar(255),
  house_extra_info_3 varchar(255),
  house_extra_info_4 varchar(255),
  agency_image_url varchar(255),
  images_url_house varchar(255),
  created_at timestamptz DEFAULT now()
);

-- Create connector_type enum
DO $$ BEGIN
  CREATE TYPE connector_type AS ENUM ('IN', 'OUT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create connectors table
CREATE TABLE IF NOT EXISTS connectors (
  id serial PRIMARY KEY,
  name varchar(255) UNIQUE NOT NULL,
  connector_config_fields text NOT NULL,
  description text,
  type connector_type NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  description text,
  pipelineURL varchar(2083) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id serial PRIMARY KEY,
  tag varchar(255) NOT NULL,
  site_id int NOT NULL,
  value varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create field_mappings table
CREATE TABLE IF NOT EXISTS field_mappings (
  id serial PRIMARY KEY,
  field_name varchar(255) NOT NULL,
  acquaint_crm varchar(255),
  propertydrive varchar(255),
  daft varchar(255),
  myhome varchar(255),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;

-- Users policies (users can only access their own data)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Agencies policies (public read, authenticated write)
CREATE POLICY "Anyone can view agencies"
  ON agencies FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert agencies"
  ON agencies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update agencies"
  ON agencies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete agencies"
  ON agencies FOR DELETE
  TO authenticated
  USING (true);

-- Properties policies (public read, authenticated write)
CREATE POLICY "Anyone can view properties"
  ON properties FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (true);

-- Connectors policies (public read, authenticated write)
CREATE POLICY "Anyone can view connectors"
  ON connectors FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert connectors"
  ON connectors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update connectors"
  ON connectors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete connectors"
  ON connectors FOR DELETE
  TO authenticated
  USING (true);

-- Pipelines policies (public read, authenticated write)
CREATE POLICY "Anyone can view pipelines"
  ON pipelines FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert pipelines"
  ON pipelines FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pipelines"
  ON pipelines FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete pipelines"
  ON pipelines FOR DELETE
  TO authenticated
  USING (true);

-- Sites policies (public read, authenticated write)
CREATE POLICY "Anyone can view sites"
  ON sites FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sites"
  ON sites FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sites"
  ON sites FOR DELETE
  TO authenticated
  USING (true);

-- Field mappings policies (public read, authenticated write)
CREATE POLICY "Anyone can view field_mappings"
  ON field_mappings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert field_mappings"
  ON field_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update field_mappings"
  ON field_mappings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete field_mappings"
  ON field_mappings FOR DELETE
  TO authenticated
  USING (true);