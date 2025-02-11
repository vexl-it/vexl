import {Config} from 'effect'

export const challengeExpirationMinutesConfig = Config.number(
  'CHALLENGE_EXPIRATION_MINUTES'
).pipe(Config.withDefault(10))
