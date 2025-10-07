import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const url = new URL(req.url);
    const agencyKey = url.searchParams.get('key');

    if (!agencyKey) {
      return new Response(
        JSON.stringify({ error: 'Agency key is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch agency to get name
    const { data: agency } = await supabase
      .from('agencies')
      .select('name, id')
      .eq('unique_key', agencyKey)
      .maybeSingle();

    if (!agency) {
      return new Response(
        JSON.stringify({ error: 'Agency not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch properties from 4PM API with timeout
    const apiUrl = `https://api2.4pm.ie/api/property/json?Key=${agencyKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      response = await fetch(apiUrl, {
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw new Error(`API connection failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const properties = await response.json();

    if (!Array.isArray(properties) || properties.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          agency: agency.name,
          total: 0,
          inserted: 0,
          errors: 0,
          message: `No properties found for ${agency.name}`
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Delete old properties for this agency
    await supabase
      .from('properties')
      .delete()
      .eq('agency_name', agency.name);

    let inserted = 0;
    let errors = 0;

    // Insert new properties
    for (const prop of properties) {
      const propertyData = {
        agency_agent_name: prop.Agent || 'Unknown',
        agency_name: agency.name,
        house_location: prop.CountyCityName || prop.ShortDescription || 'Unknown',
        house_price: prop.Price || '0',
        house_bedrooms: parseInt(prop.BedRooms) || 0,
        house_bathrooms: parseInt(prop.BathRooms) || 0,
        house_mt_squared: prop.FloorArea || '0',
        house_extra_info_1: prop.Type || null,
        house_extra_info_2: prop.Status || null,
        house_extra_info_3: prop.ShortDescription || null,
        house_extra_info_4: null,
        agency_image_url: null,
        images_url_house: prop.PrimaryImage || null,
      };

      const { error } = await supabase
        .from('properties')
        .insert(propertyData);
      
      if (error) {
        console.error('Insert error:', error);
        errors++;
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        agency: agency.name,
        total: properties.length,
        inserted,
        errors,
        message: `Synced ${inserted} properties for ${agency.name} (${errors} errors)`
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