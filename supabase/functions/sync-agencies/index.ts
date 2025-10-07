import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Agency {
  Name: string;
  OfficeName?: string;
  Address1?: string;
  Address2?: string;
  Logo?: string;
  Site?: string;
  AcquiantCustomer?: {
    SiteName?: string;
    SitePrefix?: string;
    FourPMBranchID?: number;
  };
  MyhomeApi?: {
    ApiKey?: string;
    GroupID?: number;
  };
  DaftApiKey?: string;
  Key?: string;
}

function removeDuplicateItems(items: Agency[], key: keyof Agency): Agency[] {
  const seen = new Set();
  const result: Agency[] = [];
  for (const item of items) {
    const keyValue = item[key];
    if (keyValue && !seen.has(keyValue)) {
      seen.add(keyValue);
      result.push(item);
    }
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch agencies from 4PM API
    const apiUrl = "https://api2.4pm.ie/api/Agency/GetAgency?Key=RDlaeFVPN004a0hvJTJmWUJIQTN3TVdnJTNkJTNk0";
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data: Agency[] = await response.json();
    const uniqueData = removeDuplicateItems(data, "Name");

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // Process each agency
    for (const agency of uniqueData) {
      const acquiant = agency.AcquiantCustomer || {};
      const myhome = agency.MyhomeApi || {};

      const agencyData = {
        name: agency.Name,
        office_name: agency.OfficeName || null,
        address1: agency.Address1 || '',
        address2: agency.Address2 || null,
        logo: agency.Logo || null,
        site_name: acquiant.SiteName || null,
        site_prefix: acquiant.SitePrefix || null,
        daft_api_key: agency.DaftApiKey || null,
        fourpm_branch_id: acquiant.FourPMBranchID || null,
        myhome_api_key: myhome.ApiKey || null,
        myhome_group_id: myhome.GroupID || null,
        unique_key: agency.Key || null,
      };

      // Check if agency exists
      const { data: existing } = await supabase
        .from('agencies')
        .select('id')
        .eq('unique_key', agencyData.unique_key)
        .maybeSingle();

      if (existing) {
        // Update existing agency
        const { error } = await supabase
          .from('agencies')
          .update(agencyData)
          .eq('id', existing.id);
        
        if (error) {
          console.error('Update error:', error);
          errors++;
        } else {
          updated++;
        }
      } else {
        // Insert new agency
        const { error } = await supabase
          .from('agencies')
          .insert(agencyData);
        
        if (error) {
          console.error('Insert error:', error);
          errors++;
        } else {
          inserted++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: uniqueData.length,
        inserted,
        updated,
        errors,
        message: `Synced ${inserted + updated} agencies (${inserted} new, ${updated} updated, ${errors} errors)`
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : String(error) 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});