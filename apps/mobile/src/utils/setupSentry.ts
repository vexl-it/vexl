import * as Sentry from '@sentry/react-native'
import {isStaging} from './environment'

Sentry.init({
  dsn: 'https://ce9886ea24e501f0b85a593e91cb6358@o4504456911585280.ingest.sentry.io/4506554312097792',
  debug: !isStaging, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
})
