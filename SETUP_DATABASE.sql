-- Run this SQL in your Supabase SQL Editor
-- https://rbsscozcpanldrnibtgr.supabase.co/project/_/sql

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
  address1 varchar(255) NOT NULL DEFAULT '',
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
  agency_agent_name varchar(100),
  agency_name varchar(100) NOT NULL,
  house_location varchar(255) NOT NULL,
  house_price int DEFAULT 0,
  house_bedrooms int DEFAULT 0,
  house_bathrooms int DEFAULT 0,
  house_mt_squared varchar(255) DEFAULT '',
  house_extra_info_1 varchar(255),
  house_extra_info_2 varchar(255),
  house_extra_info_3 varchar(255),
  house_extra_info_4 varchar(255),
  agency_image_url varchar(255),
  images_url_house varchar(255),
  created_at timestamptz DEFAULT now(),
  UNIQUE(agency_name, house_location)
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read agencies" ON agencies;
DROP POLICY IF EXISTS "Allow anonymous insert agencies" ON agencies;
DROP POLICY IF EXISTS "Allow anonymous update agencies" ON agencies;
DROP POLICY IF EXISTS "Allow anonymous read properties" ON properties;
DROP POLICY IF EXISTS "Allow anonymous insert properties" ON properties;
DROP POLICY IF EXISTS "Allow anonymous update properties" ON properties;
DROP POLICY IF EXISTS "Allow anonymous read field_mappings" ON field_mappings;
DROP POLICY IF EXISTS "Allow anonymous insert field_mappings" ON field_mappings;
DROP POLICY IF EXISTS "Allow anonymous update field_mappings" ON field_mappings;
DROP POLICY IF EXISTS "Anyone can view connectors" ON connectors;
DROP POLICY IF EXISTS "Anyone can view pipelines" ON pipelines;
DROP POLICY IF EXISTS "Anyone can view sites" ON sites;

-- Allow anonymous access for agencies
CREATE POLICY "Allow anonymous read agencies"
  ON agencies FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert agencies"
  ON agencies FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update agencies"
  ON agencies FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous access for properties
CREATE POLICY "Allow anonymous read properties"
  ON properties FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert properties"
  ON properties FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update properties"
  ON properties FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous access for field_mappings
CREATE POLICY "Allow anonymous read field_mappings"
  ON field_mappings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert field_mappings"
  ON field_mappings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update field_mappings"
  ON field_mappings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Public policies for other tables
CREATE POLICY "Anyone can view connectors"
  ON connectors FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view pipelines"
  ON pipelines FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view sites"
  ON sites FOR SELECT
  TO public
  USING (true);
