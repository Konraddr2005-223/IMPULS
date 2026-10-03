/**
 * Edge Function: generate-application (role C)
 *
 * Deploy: supabase functions deploy generate-application
 * Secret: OPENAI_API_KEY (optional — without it client uses local mock)
 *
 * When key is set: OpenAI Structured Outputs → save application.
 * Costs: only catalog IDs from author input (model cannot invent prices).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import {
  APPLICATION_JSON_SCHEMA,
  BO_SYSTEM_PROMPT,
  CATALOG_IDS,
} from "../_shared/boPrompt.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const MODEL = "gpt-4.1-mini-2025-04-14"
const ALLOWED = new Set<string>(CATALOG_IDS)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Unauthorized" }, 401)

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
    const selectedComments = (body.selectedComments ?? []) as {
      id: string
      body: string
    }[]
    const costItems = (body.costItems ?? []) as {
      catalogId: string
      quantity: number
    }[]
    const landNote = (body.landNote as string | undefined) ?? undefined

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

    const safeCosts = costItems
      .filter((c) => ALLOWED.has(c.catalogId) && c.quantity > 0)
      .slice(0, 40)
    const safeComments = selectedComments.slice(0, 20)

    const requestKey = `${ideaId}:${idea.revision}:${safeComments.map((c) => c.id).join(",")}:${Date.now()}`

    const { data: placeholder, error: phErr } = await supabase
      .from("applications")
      .insert({
        idea_id: ideaId,
        author_id: user.id,
        idea_revision: idea.revision,
        template_version: "krakow-bo-2026-v1",
        model: MODEL,
        prompt_version: "spec-v1",
        generation_status: "generating",
        generation_request_key: requestKey,
        summary_published: false,
      })
      .select("id")
      .single()
    if (phErr || !placeholder) {
      return json({ error: phErr?.message ?? "Insert failed" }, 500)
    }

    const userPayload = {
      city: "Kraków",
      edition: "2026-demo",
      idea: {
        title: idea.title,
        description: idea.description,
        category: idea.category,
        district: idea.district_code,
        lat: idea.lat,
        lng: idea.lng,
      },
      selectedComments: safeComments,
      costItems: safeCosts,
      catalogIds: [...ALLOWED],
      landNote: landNote ?? null,
      rules: {
        titleMax: 60,
        summaryMin: 60,
        summaryMax: 250,
      },
    }

    let content: Record<string, unknown>
    try {
      content = await callOpenAi(openaiKey, userPayload)
    } catch (err) {
      await supabase
        .from("applications")
        .update({ generation_status: "failed" })
        .eq("id", placeholder.id)
      return json(
        {
          error: "OpenAI failed",
          detail: String(err),
          mode: "openai-error",
          hint: "Client may fall back to mock or load emergency example.",
        },
        502,
      )
    }

    // Force author-approved catalog quantities; never trust model prices.
    content.costItems = safeCosts
    content.generator = "openai"
    content.usedCommentIds = safeComments.map((c) => c.id)
    if (!Array.isArray(content.warnings)) content.warnings = []
    ;(content.warnings as string[]).push(
      "Treść z modelu OpenAI; ceny wyłącznie z katalogu miejskiego.",
    )
    if (landNote) (content.warnings as string[]).push(landNote)

    const { data: saved, error: saveErr } = await supabase
      .from("applications")
      .update({
        content_json: content,
        generation_status: "ready",
        input_hash: hash(userPayload),
        updated_at: new Date().toISOString(),
      })
      .eq("id", placeholder.id)
      .eq("author_id", user.id)
      .select(
        "id, idea_id, author_id, idea_revision, template_version, model, prompt_version, input_hash, content_json, generation_status, generation_request_key, summary_published, official_project_id, submitted_at, signatures_reported_at, created_at, updated_at",
      )
      .single()

    if (saveErr || !saved) {
      return json({ error: saveErr?.message ?? "Save failed" }, 500)
    }

    return json({ ok: true, mode: "openai", application: saved })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

async function callOpenAi(
  apiKey: string,
  userPayload: unknown,
): Promise<Record<string, unknown>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    let lastErr: unknown
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            temperature: 0.3,
            messages: [
              { role: "system", content: BO_SYSTEM_PROMPT },
              {
                role: "user",
                content: JSON.stringify(userPayload),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "bo_application",
                strict: true,
                schema: APPLICATION_JSON_SCHEMA,
              },
            },
          }),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`OpenAI HTTP ${res.status}: ${text.slice(0, 400)}`)
        }
        const data = await res.json()
        const raw = data.choices?.[0]?.message?.content
        if (!raw || typeof raw !== "string") {
          throw new Error("Empty OpenAI content")
        }
        return JSON.parse(raw) as Record<string, unknown>
      } catch (err) {
        lastErr = err
        if (attempt === 0) continue
      }
    }
    throw lastErr
  } finally {
    clearTimeout(timer)
  }
}

function hash(parts: unknown): string {
  const raw = JSON.stringify(parts)
  let h = 0
  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0
  }
  return `h${(h >>> 0).toString(16)}`
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}
