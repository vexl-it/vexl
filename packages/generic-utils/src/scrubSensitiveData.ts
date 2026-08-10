export const SCRUBBED_PLACEHOLDER = '[[scrubbed]]'

const SENSITIVE_KEY_REGEX =
  /token|secret|password|authorization|cookie|cypher|cipher|private|hmac|signature|hash|phonenumber|publickey/i

const PEM_KEY_BLOCK_REGEX =
  /-----BEGIN[A-Z ]*KEY-----[\s\S]*?-----END[A-Z ]*KEY-----/g

const E164_PHONE_NUMBER_REGEX = /\+[0-9]{7,15}/g

export const scrubSensitiveString = (value: string): string =>
  value
    .replace(PEM_KEY_BLOCK_REGEX, SCRUBBED_PLACEHOLDER)
    .replace(E164_PHONE_NUMBER_REGEX, SCRUBBED_PLACEHOLDER)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Best-effort scrubbing of sensitive data from an arbitrary JSON-like value,
 * mutating it in place. Values under keys that look sensitive (token, secret,
 * hash, ...) are replaced entirely; all strings are additionally scrubbed of
 * PEM key blocks and E.164 phone numbers.
 */
export const scrubSensitiveDataInPlace = (
  value: unknown,
  visited: Set<object> = new Set()
): void => {
  if (!isRecord(value) || visited.has(value)) return
  visited.add(value)

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (typeof item === 'string') value[index] = scrubSensitiveString(item)
      else scrubSensitiveDataInPlace(item, visited)
    })
    return
  }

  for (const key of Object.keys(value)) {
    const item = value[key]
    if (SENSITIVE_KEY_REGEX.test(key)) value[key] = SCRUBBED_PLACEHOLDER
    else if (typeof item === 'string') value[key] = scrubSensitiveString(item)
    else scrubSensitiveDataInPlace(item, visited)
  }
}
