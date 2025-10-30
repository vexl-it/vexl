import {Duration, pipe} from 'effect/index'

export const RATE_LIMIT_WINDOW_MS = pipe(
  Duration.decode('24 hours'),
  Duration.toMillis
)
