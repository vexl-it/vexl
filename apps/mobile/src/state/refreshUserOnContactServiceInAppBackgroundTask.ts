import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {Effect, Match, Option} from 'effect/index'
import {apiAtom} from '../api'
import {registerInAppLoadingTask} from '../utils/inAppLoadingTasks'
import reportError from '../utils/reportError'
import {generateVexlTokenActionAtom} from './notifications/actions/generateVexlTokenActionAtom'
import {sessionDataOrDummyAtom, sessionNotificationTokenAtom} from './session'
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

        const session = store.get(sessionDataOrDummyAtom)

        const sessionNotificationToken = yield* _(
          Option.fromNullable(session.sessionNotificationToken),
          Option.match({
            onSome: (token) => Effect.succeed(Option.some(token)),
            onNone: () =>
              store.set(generateVexlTokenActionAtom).pipe(
                Effect.map(Option.some),
                Effect.map((token) => {
                  store.set(
                    sessionNotificationTokenAtom,
                    Option.getOrUndefined(token)
                  )
                  return token
                }),
                Effect.catchAll((e) =>
                  Effect.zipRight(
                    Effect.sync(() => {
                      reportError(
                        'warn',
                        new Error(
                          'Error generating vexl notification token on refresh user'
                        ),
                        {e}
                      )
                    }),
                    Effect.succeed(Option.none())
                  )
                )
              ),
          })
        )

        yield* _(
          store.get(apiAtom).contact.refreshUser({
            offersAlive: true,
            countryPrefix,
            vexlNotificationToken: sessionNotificationToken,
          }),
          Effect.match({
            onFailure: (e) => {
              Match.value(e).pipe(
                Match.tag('UserNotFoundError', () => {
                  console.log('🦋 🚨 User to refresh not found. Logging out')
                  void store.set(logoutActionAtom)
                }),
                Match.tags({
                  ResponseError: () => {
                    console.warn(
                      '🦋 Network error refreshing user. Not logging out.',
                      e
                    )
                  },
                  RequestError: () => {
                    console.warn(
                      '🦋 Network error refreshing user. Not logging out.',
                      e
                    )
                  },
                }),
                Match.tag('UnexpectedServerError', () => {
                  reportError(
                    'warn',
                    new Error(
                      'Unknown error refreshing user. Not logging out.'
                    ),
                    {e}
                  )
                  console.warn(
                    '🦋 🚨 Unknown error refreshing user. Not logging out.',
                    e._tag
                  )
                }),
                Match.tags({
                  HttpApiDecodeError: () => {
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
                  },
                  ParseError: () => {
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
                  },
                }),
                Match.tag('NotFoundError', (notFoundError) => {
                  const codeStartsWith4XX = notFoundError.status
                    .toString()
                    .startsWith('4')
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
                }),
                Match.orElse(() => {
                  reportError(
                    'error',
                    new Error(
                      'Uncaught error refreshing user. Not logging out.'
                    ),
                    {e}
                  )
                  console.error(
                    '🦋 🚨 UnexpectedApiResponseError error refreshing user. Not logging out.',
                    {e}
                  )
                })
              )
            },
            onSuccess: () => {
              console.log('🦋 User refreshed')
            },
          })
        )
      }),
  })
