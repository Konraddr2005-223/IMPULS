import { mockRunBoAgent } from './mockAgent'
import { polishProposal } from './polishProposal'
import {
  boAgentInputSchema,
  boAgentProposalSchema,
  type BoAgentInput,
  type BoAgentProposal,
} from './schema'
import { AGENT_PROMPT_VERSION } from './prompt'

export type BoAgentResult = {
  proposal: BoAgentProposal
  mode: 'mock' | 'openai' | 'cursor'
  promptVersion: string
}

/**
 * Civic Budget Assistant entrypoint.
 * Prefers local Vite `/api/bo-agent` (Cursor SDK + CURSOR_API_KEY);
 * falls back to deterministic mock when the key/API is unavailable.
 */
export async function runBoAgent(raw: BoAgentInput): Promise<BoAgentResult> {
  const input = boAgentInputSchema.parse(raw)

  try {
    const res = await fetch('/api/bo-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = (await res.json()) as {
      proposal?: BoAgentProposal
      mode?: string
      promptVersion?: string
      detail?: string
      error?: string
    }

    if (res.ok && data.proposal) {
      const proposal = polishProposal(
        boAgentProposalSchema.parse({
          ...data.proposal,
          generator: data.proposal.generator ?? 'cursor',
        }),
      )
      return {
        proposal,
        mode: data.mode === 'cursor' ? 'cursor' : proposal.generator,
        promptVersion: data.promptVersion ?? AGENT_PROMPT_VERSION,
      }
    }
  } catch {
    // Dev server / network unavailable → mock below.
  }

  const proposal = mockRunBoAgent(input)
  return {
    proposal,
    mode: 'mock',
    promptVersion: AGENT_PROMPT_VERSION,
  }
}
