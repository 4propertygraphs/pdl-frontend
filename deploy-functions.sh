#!/bin/bash

echo "Deploying edge functions with JWT verification disabled..."

# Deploy api-proxy without JWT verification
supabase functions deploy api-proxy --no-verify-jwt

# Deploy sync-agencies without JWT verification
supabase functions deploy sync-agencies --no-verify-jwt

# Deploy sync-properties without JWT verification
supabase functions deploy sync-properties --no-verify-jwt

# Deploy get-info without JWT verification
supabase functions deploy get-info --no-verify-jwt

echo "All functions deployed successfully!"
