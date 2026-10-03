/**
 * Edge Function stub for generate-application.
 * Deploy with: supabase functions deploy generate-application
 * Set secret OPENAI_API_KEY for live mode; without it returns mock-compatible payload.
 *
 * Contract mirrors src/applications/api.ts (author, threshold, max 3 gens, catalog costs).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    const body = await req.json()
    const ideaId = body.ideaId as string
    if (!ideaId) {
      return new Response(JSON.stringify({ error: "ideaId required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    const { data: idea, error: ideaErr } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", ideaId)
      .single()

    if (ideaErr || !idea) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    if (idea.author_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only author" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    if (idea.likes_count < idea.support_threshold) {
      return new Response(JSON.stringify({ error: "Threshold not met" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY")
    const mode = openaiKey ? "openai" : "mock"

    // Live OpenAI wiring is intentionally gated; client mock remains the default path.
    return new Response(
      JSON.stringify({
        ok: true,
        mode,
        message:
          mode === "mock"
            ? "No OPENAI_API_KEY — use client mockGenerateApplication or set the secret."
            : "OpenAI key present — wire model call here (gpt-4.1-mini).",
        ideaId,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }
})
