import * as Sentry from '@sentry/react-native'
import {commitHash, isProd, isStaging} from './environment'

const enableSentry = !__DEV__

console.debug(enableSentry ? 'Sentry enabled' : 'Sentry disbaled')

Sentry.init({
  dsn: enableSentry
    ? 'https://ce9886ea24e501f0b85a593e91cb6358@o4504456911585280.ingest.sentry.io/4506554312097792'
    : '',
  debug: enableSentry && !isProd, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: __DEV__ ? 'dev' : isStaging ? 'staging' : 'production',
  release: commitHash,
  tracesSampleRate: 0.2,
})
