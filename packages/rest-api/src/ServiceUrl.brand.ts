import {z} from 'zod'
export const ServiceUrl = z.string().url().brand<'ServiceUrl'>()
export type ServiceUrl = z.infer<typeof ServiceUrl>
