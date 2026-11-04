import {type SpanProcessor} from '@opentelemetry/sdk-trace-base'
import {Array, pipe} from 'effect'

const TRACED_HEADERS = [
  'accept',
  'content-type',
  'content-length',
  'client-version',
  'x-platform',
]
const HEADER_ATTRIBUTE_PREFIXES = [
  'http.request.header.',
  'http.response.header.',
]
const URL_ATTRIBUTES_WITH_QUERY = ['url.full', 'url.query']

const isSensitiveAttribute = (key: string): boolean =>
  Array.contains(URL_ATTRIBUTES_WITH_QUERY, key) ||
  pipe(
    HEADER_ATTRIBUTE_PREFIXES,
    Array.some(
      (prefix) =>
        key.startsWith(prefix) &&
        !Array.contains(TRACED_HEADERS, key.slice(prefix.length))
    )
  )

// Effect's HTTP tracing records every header and the full URL with no allowlist
// option, so sensitive attributes are removed from the finished span in place.
export const scrubbingSpanProcessor = (
  processor: SpanProcessor
): SpanProcessor => ({
  onStart: (span, context) => {
    processor.onStart(span, context)
  },
  onEnd: (span) => {
    pipe(
      Object.keys(span.attributes),
      Array.filter(isSensitiveAttribute),
      Array.forEach((key) => Reflect.deleteProperty(span.attributes, key))
    )
    processor.onEnd(span)
  },
  forceFlush: async () => {
    await processor.forceFlush()
  },
  shutdown: async () => {
    await processor.shutdown()
  },
})
