export function getEnvValue(name: string, defaultValue?: string): string {
  const rawValue = process.env[name]
  if (!rawValue && defaultValue) return defaultValue
  if (!rawValue) throw new Error(`Missing env variable ${name}`)

  return rawValue
}
