import { z } from 'zod'
import { costCatalog } from '../city/krakow/config'

const catalogIds = costCatalog.items.map((i) => i.id) as [string, ...string[]]

export const agentCostItemSchema = z.object({
  catalogId: z.enum(catalogIds),
  quantity: z.number().int().positive().max(500),
})

export const agentChecklistItemSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(280),
  required: z.boolean(),
  reason: z.string().min(1).max(400),
})

export const agentScheduleItemSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(400),
  date: z.string().max(40).nullable(),
})

/**
 * Structured BO draft aligned with official Kraków form steps
 * (instrukcja budzet.krakow.pl 2026: Podstawowe dane → Opis → Kosztorys).
 */
export const boAgentProposalSchema = z.object({
  /** Charakter zgłaszanej propozycji zadania */
  scope: z.enum(['district', 'city']),
  /** Rodzaj — inwestycyjny / nieinwestycyjny (jak wariant pól urzędu) */
  projectType: z.enum(['investment', 'non_investment']).default('investment'),
  /** Tytuł propozycji zadania — max 60 znaków */
  title: z.string().min(3).max(60),
  /** Krótki opis propozycji zadania — 60–250 znaków */
  summary: z.string().min(60).max(250),
  /** Miejsce realizacji propozycji zadania */
  location: z.string().min(3).max(200),
  /** Szczegółowy opis propozycji zadania */
  description: z.string().min(40).max(4000),
  /** Uzasadnienie dla realizacji propozycji zadania */
  justification: z.string().min(40).max(2000),
  targetGroups: z.array(z.string().min(2).max(80)).min(1).max(8),
  /** Uzasadnienie spełnienia kryterium ogólnodostępności */
  accessibility: z.string().min(20).max(500),
  /** Szacunkowe koszty — tylko catalogId + quantity */
  costItems: z.array(agentCostItemSchema).max(12),
  /** Harmonogram działań związanych z wykonywaniem propozycji zadania */
  schedule: z.array(agentScheduleItemSchema).min(1).max(8),
  missingInformation: z.array(z.string().max(200)).max(20),
  warnings: z.array(z.string().max(280)).max(20),
  checklist: z.array(agentChecklistItemSchema).min(2).max(12),
  generator: z.enum(['mock', 'openai', 'cursor']),
})

export type BoAgentProposal = z.infer<typeof boAgentProposalSchema>

export const boAgentInputSchema = z.object({
  ideaText: z.string().trim().min(8).max(2000),
  location: z.string().trim().max(200).optional(),
  neighborComments: z.string().trim().max(2000).optional(),
})

export type BoAgentInput = z.infer<typeof boAgentInputSchema>

/** Official Kraków form labels (instrukcja 2026). */
export const OFFICIAL_FORM_LABELS = {
  scope: 'Charakter zgłaszanej propozycji zadania',
  projectType: 'Rodzaj projektu',
  title: 'Tytuł propozycji zadania',
  summary: 'Krótki opis propozycji zadania',
  location: 'Miejsce realizacji propozycji zadania',
  description: 'Szczegółowy opis propozycji zadania',
  justification: 'Uzasadnienie dla realizacji propozycji zadania',
  targetGroups: 'Grupy docelowe / odbiorcy',
  accessibility: 'Uzasadnienie spełnienia kryterium ogólnodostępności',
  costEstimate: 'Szacunkowe koszty realizacji propozycji zadania',
  schedule: 'Harmonogram działań związanych z wykonywaniem propozycji zadania',
  checklist: 'Dokumenty i następne kroki (poza formularzem online)',
} as const
