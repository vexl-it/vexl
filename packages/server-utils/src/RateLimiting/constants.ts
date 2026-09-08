import {Duration, pipe} from 'effect'

export const RATE_LIMIT_WINDOW_MS = pipe(
  Duration.fromInputUnsafe('24 hours'),
  Duration.toMillis
)
