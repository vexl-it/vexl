import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {Effect} from 'effect/index'
import {apiAtom} from '../api'
import {registerInAppLoadingTask} from '../utils/inAppLoadingTasks'
import reportError from '../utils/reportError'
import {sessionDataOrDummyAtom} from './session'
import {logoutActionAtom} from './useLogout'

export const refreshUserOnContactServiceInAppBackgroundTaskId =
  registerInAppLoadingTask({
    name: 'refreshUserOnContactService',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    task: (store) =>
      Effect.gen(function* (_) {
        const countryPrefix = yield* _(
          store.get(sessionDataOrDummyAtom).phoneNumber,
          countryPrefixFromNumber,
          Effect.option
        )

        yield* _(
          store.get(apiAtom).contact.refreshUser({
            offersAlive: true,
            countryPrefix,
          }),

          Effect.match({
            onFailure: (e) => {
              if (e._tag === 'UserNotFoundError') {
                console.log('🦋 🚨 User to refresh not found. Logging out')
                void store.set(logoutActionAtom)
              } else if (
                e._tag === 'ResponseError' ||
                e._tag === 'RequestError'
              ) {
                console.warn(
                  '🦋 Network error refreshing user. Not logging out.',
                  e
                )
              } else if (e._tag === 'UnexpectedServerError') {
                reportError(
                  'warn',
                  new Error('Unknown error refreshing user. Not logging out.'),
                  {e}
                )
                console.warn(
                  '🦋 🚨 Unknown error refreshing user. Not logging out.',
                  e._tag
                )
              } else if (
                e._tag === 'HttpApiDecodeError' ||
                e._tag === 'ParseError'
              ) {
                reportError(
                  'warn',
                  new Error(
                    'HttpApiDecodeError or ParseError error refreshing user. Not logging out.'
                  ),
                  {e}
                )
                console.warn(
                  '🦋 🚨 UnexpectedApiResponseError error refreshing user. Not logging out.',
                  e._tag
                )
              } else if (e._tag === 'NotFoundError') {
                const codeStartsWith4XX = e.status.toString().startsWith('4')
                if (codeStartsWith4XX) {
                  console.warn('🦋 🚨 Bad status code while refreshing user')
                  reportError(
                    'warn',
                    new Error(
                      'Bad status code while error refreshing user. Not logging out.'
                    ),
                    {e}
                  )
                  void store.set(logoutActionAtom)
                } else {
                  console.warn('🦋 🚨 Bad status code while refreshing user')
                  reportError(
                    'warn',
                    new Error(
                      'Bad status code error refreshing user. Not logging out.'
                    ),
                    {e}
                  )
                }
              } else {
                reportError(
                  'error',
                  new Error('Uncaught error refreshing user. Not logging out.'),
                  {e}
                )
                console.error(
                  '🦋 🚨 UnexpectedApiResponseError error refreshing user. Not logging out.',
                  {e}
                )
              }
              return Effect.void
            },
            onSuccess: () => {
              console.log('🦋 User refreshed')
              return Effect.void
            },
          })
        )
      }),
  })
