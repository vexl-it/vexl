import 'dotenv/config'

import {z} from 'zod'

const EnvironmentShape = z.object({
  PORT: z.number().int().positive().default(3000),
  HEALTH_SERVER_PORT: z.number().int().positive().default(3001),
  SENTRY_DNS: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string(),
  ENVIRONMENT: z.enum(['production', 'staging', 'local']).default('local'),
})
export type EnvironmentShape = z.TypeOf<typeof EnvironmentShape>

const env = EnvironmentShape.parse(process.env)
export default env
