import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'not-set';
  
  const info = {
    requestUrl: url.href,
    host: url.host,
    supabaseUrl: supabaseUrl,
    message: 'Supabase Info'
  };

  return new Response(
    JSON.stringify(info, null, 2),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  );
});