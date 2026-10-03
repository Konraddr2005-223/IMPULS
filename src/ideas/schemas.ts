import { z } from 'zod'

export const createIdeaSchema = z.object({
  title: z.string().trim().min(3, 'Min. 3 znaki').max(60, 'Max. 60 znaków'),
  description: z.string().trim().min(20, 'Min. 20 znaków'),
  category: z.enum(['investment', 'non_investment']),
  districtCode: z.string().trim().optional(),
  supportThreshold: z.number().int().min(1).max(50),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export type CreateIdeaFormValues = z.infer<typeof createIdeaSchema>

export const createFaultSchema = z.object({
  category: z.string().min(1),
  description: z.string().trim().min(10, 'Min. 10 znaków'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export type CreateFaultFormValues = z.infer<typeof createFaultSchema>
