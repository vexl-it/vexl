import {Effect, Match, Option} from 'effect/index'
import {apiAtom} from '../api'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
  type InAppLoadingTaskDependency,
} from '../utils/inAppLoadingTasks'
import reportError from '../utils/reportError'
import {generateVexlTokenActionAtom} from './notifications/actions/generateVexlTokenActionAtom'
import {forgetVexlSecretLocally} from './notifications/vexlNotificationTokenAtom'
import {clearDeviceAfterLoginOnAnotherDeviceActionAtom} from './resetLocalDataActionAtom'
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
            vexlNotificationToken: sessionNotificationToken,
            loginSessionId: session.loginSessionId,
          }),
          Effect.matchEffect({
            onFailure: (e) => {
              Match.value(e).pipe(
                Match.tag('UserNotFoundError', () => {
                  console.log('🦋 🚨 User to refresh not found. Logging out')
                  void store.set(logoutActionAtom)
                }),
                Match.tag('LoggedInOnAnotherDeviceError', () => {
                  console.log(
                    '🦋 🚨 Account is active on another device. Clearing local data only.'
                  )
                  // Right away, before the wipe: the new device took over the
                  // secret, a token sync from here would steal its pushes back.
                  forgetVexlSecretLocally(store)
                  void store.set(clearDeviceAfterLoginOnAnotherDeviceActionAtom)
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

              // Fails the task so tasks touching server data skip this device
              return e._tag === 'LoggedInOnAnotherDeviceError'
                ? Effect.fail(
                    new InAppLoadingTaskError({
                      message: 'Account is active on another device',
                    })
                  )
                : Effect.void
            },
            onSuccess: () => {
              console.log('🦋 User refreshed')
              return Effect.void
            },
          })
        )
      }),
  })

/**
 * For tasks that pull messages or change server data: a device whose account
 * moved to another device must not touch it. Network errors don't block them.
 */
export const afterRefreshUserUnlessAccountMoved: InAppLoadingTaskDependency = {
  id: refreshUserOnContactServiceInAppBackgroundTaskId,
  onlyIfSucceeds: true,
}
