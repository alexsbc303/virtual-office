// Inserts one portal_handoffs row with the service role.
// The browser calls this with the anon key (verify_jwt). The service-role
// key is read from the function environment only and is never returned.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const LEAD_ID = "664766c4-1928-4909-8d79-90a3c38f786c";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clip(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "method" }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "json" }, 400);
  }

  const bot = (body.bot ?? {}) as Record<string, unknown>;
  const lead = (body.lead ?? {}) as Record<string, unknown>;
  const message = clip(body.message, 500);
  const id = String(body.id ?? "");
  const botId = String(bot.id ?? "");
  const leadId = String(lead.id ?? "");

  if (body.type !== "portal_handoff") return json({ ok: false, error: "type" }, 400);
  if (body.source !== "virtual-office") return json({ ok: false, error: "source" }, 400);
  if (!UUID_RE.test(id) || !UUID_RE.test(botId)) return json({ ok: false, error: "id" }, 400);
  if (leadId !== LEAD_ID) return json({ ok: false, error: "lead" }, 400);
  if (message.length < 1 || message.length > 500) {
    return json({ ok: false, error: "message" }, 400);
  }

  let createdAt = new Date().toISOString();
  if (typeof body.created_at === "string" && Number.isFinite(Date.parse(body.created_at))) {
    createdAt = new Date(body.created_at).toISOString();
  }

  const payload = {
    type: "portal_handoff",
    id,
    created_at: createdAt,
    source: "virtual-office",
    bot: {
      id: botId,
      name: clip(bot.name, 80),
      dept: clip(bot.dept, 80),
    },
    lead: { id: LEAD_ID, name: "Bot 總管" },
    message,
  };

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceKey) {
    return json({ ok: false, error: "server" }, 500);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin.from("portal_handoffs").insert({
    id: payload.id,
    bot_id: payload.bot.id,
    lead_id: payload.lead.id,
    message: payload.message,
    source: payload.source,
    payload,
    created_at: payload.created_at,
  });

  if (error) {
    console.error("portal-handoff insert failed", error.code);
    return json({ ok: false, error: "insert" }, 500);
  }

  return json({ ok: true, id: payload.id });
});
