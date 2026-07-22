import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { isOriginAllowed, json, options } from "../_shared/http.ts";

const USERNAME = /^[a-zA-Z0-9._-]{3,40}$/;
const WAREHOUSE_TYPES = new Set([
  "Standard Dry Storage",
  "Cold Storage",
  "Heavy Racking",
  "Custom Industrial",
]);

const validText = (value: unknown, max: number) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= max;

const validDimension = (value: unknown, max = 10_000) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value > 0 &&
  value <= max;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options(request);
  if (request.method !== "POST")
    return json(request, { error: "Method not allowed" }, 405);
  if (!isOriginAllowed(request))
    return json(request, { error: "Origin not allowed" }, 403);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization)
      return json(request, { error: "Not authenticated" }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceRoleKey)
      throw new Error("Missing function configuration");

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user)
      return json(request, { error: "Not authenticated" }, 401);
    if (user.app_metadata?.role !== "admin")
      return json(request, { error: "Forbidden" }, 403);

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 20_000)
      return json(request, { error: "Request is too large" }, 413);

    const body = await request.json();
    const username =
      typeof body?.username === "string"
        ? body.username.trim().toLowerCase()
        : "";
    const password = body?.password;
    const client = body?.client;

    if (
      !USERNAME.test(username) ||
      typeof password !== "string" ||
      password.length < 12 ||
      password.length > 128
    ) {
      return json(
        request,
        {
          error:
            "Use a valid username and a password of at least 12 characters.",
        },
        400,
      );
    }
    if (
      !client ||
      !validText(client.client_name, 120) ||
      !validText(client.company_name, 160) ||
      client.username !== username ||
      !validDimension(client.length_ft) ||
      !validDimension(client.width_ft) ||
      !validDimension(client.height_ft) ||
      !validDimension(client.total_sqft, 100_000_000) ||
      !WAREHOUSE_TYPES.has(client.warehouse_type) ||
      !validText(client.current_stage, 2000)
    ) {
      return json(
        request,
        { error: "Please check the client and warehouse details." },
        400,
      );
    }

    const admin = createClient(url, serviceRoleKey);
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: `${username}@cipl.lk`,
        password,
        email_confirm: true,
        app_metadata: { role: "client" },
      });
    if (authError || !authData.user)
      throw authError || new Error("Unable to create client login");

    const authUserId = authData.user.id;
    const { data: clientRow, error: clientError } = await admin
      .from("clients")
      .insert({
        auth_user_id: authUserId,
        client_name: client.client_name.trim(),
        company_name: client.company_name.trim(),
        username,
        length_ft: client.length_ft,
        width_ft: client.width_ft,
        height_ft: client.height_ft,
        total_sqft: client.total_sqft,
        warehouse_type: client.warehouse_type,
        current_stage: client.current_stage.trim(),
      })
      .select("id, auth_user_id")
      .single();

    if (clientError || !clientRow) {
      await admin.auth.admin.deleteUser(authUserId);
      throw clientError || new Error("Unable to create client project");
    }

    return json(request, { client: clientRow });
  } catch (error) {
    console.error(
      "Client creation failed:",
      error instanceof Error ? error.message : error,
    );
    return json(
      request,
      { error: "Unable to create the client project." },
      500,
    );
  }
});
