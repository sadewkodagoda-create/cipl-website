const TEMPORARY_UNAVAILABLE = "Supabase is temporarily unavailable.";

function sendJson(response, status, body) {
  response.status(status);
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { ok: false, error: "Method not allowed." });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  const expectedAuthorization = cronSecret ? `Bearer ${cronSecret}` : "";

  if (
    !expectedAuthorization ||
    request.headers.authorization !== expectedAuthorization
  ) {
    sendJson(response, 401, { ok: false, error: "Unauthorized." });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    console.error("Supabase health check is missing server configuration.");
    sendJson(response, 503, { ok: false, error: TEMPORARY_UNAVAILABLE });
    return;
  }

  try {
    const result = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/clients?select=id&limit=1`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
        signal: AbortSignal.timeout(8_000),
      },
    );

    if (!result.ok) {
      console.error(`Supabase health check returned HTTP ${result.status}.`);
      sendJson(response, 503, { ok: false, error: TEMPORARY_UNAVAILABLE });
      return;
    }

    // Consume the response without returning database contents to the caller.
    await result.arrayBuffer();
    sendJson(response, 200, {
      ok: true,
      service: "supabase",
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Supabase health check request failed.",
      error instanceof Error ? error.message : "Unknown error",
    );
    sendJson(response, 503, { ok: false, error: TEMPORARY_UNAVAILABLE });
  }
}
