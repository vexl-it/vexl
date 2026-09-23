import {Schema} from 'effect'

const hasProtocol =
  (...protocols: readonly string[]) =>
  (url: string): boolean => {
    try {
      return protocols.includes(new URL(url).protocol)
    } catch {
      return false
    }
  }

export const HttpsUrl = Schema.String.pipe(Schema.filter(hasProtocol('https:')))

export const HttpUrl = Schema.String.pipe(
  Schema.filter(hasProtocol('https:', 'http:'))
)
