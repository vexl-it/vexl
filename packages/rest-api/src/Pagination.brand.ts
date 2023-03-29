import {z} from 'zod'

export const PageRequest = z.object({
  page: z.number().int().min(0),
  limit: z.number().int().min(0),
})

export const PageResponse = z.object({
  nextLink: z.string().nullable(),
  prevLink: z.string().nullable(),
  currentPage: z.number().int().min(0),
  currentPageSize: z.number().int().min(0),
  pagesTotal: z.number().int().min(0),
  itemsCount: z.number().int().min(0),
  itemsCountTotal: z.number().int().min(0),
})
