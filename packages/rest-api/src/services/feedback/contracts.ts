import {RegionCode} from '@vexl-next/domain/src/utility/RegionCode.brand'
import z from 'zod'

export const SubmitFeedbackRequest = z.object({
  formId: z.string().min(1),
  type: z.enum(['create', 'trade']),
  stars: z.number().optional(),
  objections: z.string().optional(),
  textComment: z.string().optional(),
  countryCode: RegionCode.optional(),
})

export type SubmitFeedbackRequest = z.TypeOf<typeof SubmitFeedbackRequest>
