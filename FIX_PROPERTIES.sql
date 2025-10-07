-- Fix properties table structure
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists
DROP TABLE IF EXISTS properties CASCADE;

-- Create properties table with all required columns
CREATE TABLE properties (
  id serial PRIMARY KEY,
  agency_agent_name varchar(100),
  agency_name varchar(100) NOT NULL,
  house_location varchar(255) NOT NULL,
  house_price int DEFAULT 0,
  house_bedrooms int DEFAULT 0,
  house_bathrooms int DEFAULT 0,
  house_mt_squared varchar(255),
  house_extra_info_1 varchar(255),
  house_extra_info_2 varchar(255),
  house_extra_info_3 varchar(255),
  house_extra_info_4 varchar(255),
  agency_image_url varchar(255),
  images_url_house varchar(255),
  created_at timestamptz DEFAULT now(),
  UNIQUE(agency_name, house_location)
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create public policies for read access
CREATE POLICY "Public can view properties"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create public policies for insert access
CREATE POLICY "Public can insert properties"
  ON properties FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create public policies for update access
CREATE POLICY "Public can update properties"
  ON properties FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create public policies for delete access
CREATE POLICY "Public can delete properties"
  ON properties FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_properties_agency_name ON properties(agency_name);
CREATE INDEX idx_properties_created_at ON properties(created_at);
