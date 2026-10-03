/**
 * Edge Function: generate-application (role C)
 *
 * Deploy:
 *   supabase functions deploy generate-application
 * Secrets:
 *   OPENAI_API_KEY — when set, use OpenAI; otherwise return { mode: 'mock' }
 *     so the client falls back to mockGenerateApplication.
 *
 * Contract: author-only, threshold check, max 3 gens, max 20 comments,
 * costs from catalog only, structured JSON (see src/applications/systemPrompt.ts).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401)
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return json({ error: "Unauthorized" }, 401)

    const body = await req.json()
    const ideaId = body.ideaId as string
    if (!ideaId) return json({ error: "ideaId required" }, 400)

    const { data: idea, error: ideaErr } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", ideaId)
      .single()
    if (ideaErr || !idea) return json({ error: "Idea not found" }, 404)
    if (idea.author_id !== user.id) return json({ error: "Only author" }, 403)
    if (idea.likes_count < idea.support_threshold) {
      return json({ error: "Threshold not met" }, 400)
    }

    const { count } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId)
    if ((count ?? 0) >= 3) return json({ error: "Generation limit" }, 400)

    const { data: inflight } = await supabase
      .from("applications")
      .select("id")
      .eq("idea_id", ideaId)
      .eq("generation_status", "generating")
      .limit(1)
    if (inflight && inflight.length > 0) {
      return json({ error: "Generation in progress" }, 409)
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiKey) {
      return json({
        ok: true,
        mode: "mock",
        message:
          "No OPENAI_API_KEY — client should use mockGenerateApplication.",
        ideaId,
      })
    }

    // Placeholder for live OpenAI Structured Outputs wiring.
    // Until implemented, signal client to use mock to avoid inventing prices.
    return json({
      ok: true,
      mode: "openai-pending",
      message:
        "OPENAI_API_KEY present. Wire Responses API + schema here; costs stay catalog-side.",
      ideaId,
    })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}
