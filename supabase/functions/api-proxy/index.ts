const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, token, key",
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
    const path = url.searchParams.get('path') || '';
    const method = req.method;
    
    const apiUrl = `https://api.stefanmars.nl${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const token = req.headers.get('token');
    if (token) {
      headers['token'] = token;
    }
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const key = req.headers.get('key');
    if (key) {
      headers['key'] = key;
    }
    
    let body = null;
    if (method === 'POST' || method === 'PUT') {
      body = await req.text();
    }
    
    const response = await fetch(apiUrl, {
      method,
      headers,
      body,
    });
    
    const data = await response.text();
    
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
      JSON.stringify({ error: error.message }),
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