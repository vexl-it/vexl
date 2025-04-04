import {Schema} from 'effect'

function isValidHttpsUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'https:'
  } catch (error) {
    return false
  }
}

export const HttpsUrlString = Schema.String.pipe(
  Schema.filter(isValidHttpsUrl),
  Schema.brand('HttpsUrlString')
)
export type HttpsUrlString = typeof HttpsUrlString.Type
