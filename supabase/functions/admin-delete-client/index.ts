import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { isOriginAllowed, json, options } from "../_shared/http.ts";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    const { client_id: clientId } = await request.json();
    if (typeof clientId !== "string" || !UUID.test(clientId)) {
      return json(request, { error: "Invalid client ID" }, 400);
    }

    const admin = createClient(url, serviceRoleKey);
    const { data: client, error: clientError } = await admin
      .from("clients")
      .select("id, auth_user_id")
      .eq("id", clientId)
      .single();
    if (clientError || !client)
      return json(request, { error: "Client not found" }, 404);

    const { data: modelRows, error: modelRowsError } = await admin
      .from("project_model_updates")
      .select("model_path")
      .eq("client_id", clientId);
    if (modelRowsError) throw modelRowsError;
    const modelPaths = (modelRows || []).map((row) => row.model_path);
    if (modelPaths.length) {
      const { error: modelRemoveError } = await admin.storage
        .from("construction-models")
        .remove(modelPaths);
      if (modelRemoveError) throw modelRemoveError;
    }

    for (const bucketName of ["warehouse-plans", "progress-photos"]) {
      const bucket = admin.storage.from(bucketName);
      while (true) {
        const { data: objects, error: listError } = await bucket.list(
          client.auth_user_id,
          {
            limit: 100,
            offset: 0,
            sortBy: { column: "name", order: "asc" },
          },
        );
        if (listError) throw listError;
        const paths = (objects || [])
          .filter((object) => object.id !== null)
          .map((object) => `${client.auth_user_id}/${object.name}`);
        if (paths.length) {
          const { error: removeError } = await bucket.remove(paths);
          if (removeError) throw removeError;
        }
        if (!objects || objects.length < 100) break;
      }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(
      client.auth_user_id,
    );
    if (deleteError) throw deleteError;

    return json(request, { deleted: true });
  } catch (error) {
    console.error(
      "Client deletion failed:",
      error instanceof Error ? error.message : error,
    );
    return json(
      request,
      { error: "Unable to delete the client project." },
      500,
    );
  }
});
