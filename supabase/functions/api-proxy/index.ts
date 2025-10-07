import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, token, key, apiKey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace('/api-proxy', '');
    const search = url.search;
    const method = req.method;

    console.log('Incoming request:', { method, pathname, search, url: req.url });

    const apiUrl = `https://api.stefanmars.nl/api${pathname}${search}`;
    console.log('Target API URL:', apiUrl);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = req.headers.get('token');
    if (token) {
      headers['token'] = token;
      console.log('Token header found');
    }

    const key = req.headers.get('key');
    if (key) {
      headers['key'] = key;
      console.log('Key header found');
    }

    const apiKey = req.headers.get('apiKey');
    if (apiKey) {
      headers['apiKey'] = apiKey;
      console.log('ApiKey header found');
    }

    let body = null;
    if (method === 'POST' || method === 'PUT') {
      body = await req.text();
      console.log('Request body:', body);
    }

    console.log('Forwarding to external API with headers:', headers);

    const response = await fetch(apiUrl, {
      method,
      headers,
      body,
    });

    console.log('External API response status:', response.status);

    const data = await response.text();
    console.log('External API response data:', data);

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
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
