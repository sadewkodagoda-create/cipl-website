const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function isOriginAllowed(request: Request) {
  const origin = request.headers.get("Origin");
  return (
    !origin ||
    configuredOrigins.length === 0 ||
    configuredOrigins.includes(origin)
  );
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = isOriginAllowed(request) ? origin || "*" : "null";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

export function json(
  request: Request,
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function options(request: Request) {
  return new Response(null, {
    status: isOriginAllowed(request) ? 204 : 403,
    headers: corsHeaders(request),
  });
}
