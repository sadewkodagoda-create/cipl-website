import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { isOriginAllowed, json, options } from "../_shared/http.ts";

const INQUIRY_RECIPIENT = "Chanithu1970@gmail.com";

const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function fingerprintRequest(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const address =
    request.headers.get("cf-connecting-ip") || forwarded || "unknown";
  const agent = request.headers.get("user-agent") || "unknown";
  const salt =
    Deno.env.get("INQUIRY_RATE_LIMIT_SALT") ||
    Deno.env.get("SUPABASE_URL") ||
    "cipl";
  const bytes = new TextEncoder().encode(`${salt}:${address}:${agent}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options(request);
  if (request.method !== "POST")
    return json(request, { error: "Method not allowed" }, 405);
  if (!isOriginAllowed(request))
    return json(request, { error: "Origin not allowed" }, 403);

  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 20_000)
      return json(request, { error: "Request is too large" }, 413);

    const body = await request.json();
    if (typeof body?.website === "string" && body.website.trim()) {
      return json(request, { success: true });
    }

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const company =
      typeof body?.company === "string" ? body.company.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";

    if (
      !name ||
      name.length > 120 ||
      company.length > 120 ||
      !validEmail.test(email) ||
      email.length > 254 ||
      !phone ||
      phone.length > 40 ||
      !message ||
      message.length > 5000
    ) {
      return json(
        request,
        { error: "Please check the inquiry details and try again." },
        400,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Contact function is missing required Supabase secrets.");
      return json(
        request,
        { error: "Contact storage is not configured." },
        500,
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const fingerprint = await fingerprintRequest(request);
    const { data: allowed, error: rateError } = await admin.rpc(
      "consume_inquiry_rate_limit",
      {
        p_fingerprint: fingerprint,
        p_limit: 5,
        p_window_seconds: 900,
      },
    );
    if (rateError) throw rateError;
    if (!allowed)
      return json(
        request,
        { error: "Too many inquiries. Please try again later." },
        429,
      );

    const { data: inquiry, error: insertError } = await admin
      .from("inquiries")
      .insert({ name, company: company || null, email, phone, message })
      .select("id")
      .single();
    if (insertError || !inquiry)
      throw insertError || new Error("Unable to save inquiry");

    // Live email delivery is intentionally paused. Keep the intended recipient
    // explicit so dispatch can be restored later without changing form storage.
    console.info(
      `Inquiry ${inquiry.id} saved; email delivery paused for ${INQUIRY_RECIPIENT}.`,
    );

    return json(request, { success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit inquiry";
    console.error("Inquiry submission failed:", message);
    return json(request, { error: "Unable to submit inquiry." }, 500);
  }
});
