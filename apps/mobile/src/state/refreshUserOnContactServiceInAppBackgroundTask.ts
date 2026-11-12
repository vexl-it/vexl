import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {LoggedInOnAnotherDeviceError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {
  Array,
  Effect,
  Either,
  Exit,
  Fiber,
  Match,
  Option,
  pipe,
} from 'effect/index'
import {atom, type Getter} from 'jotai'
import {type Store} from 'jotai/vanilla/store'
import {phoneNumberContactApisAtom} from '../api/contactApiForSession'
import {type SessionV2} from '../brands/Session.brand'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
  type InAppLoadingTaskDependency,
} from '../utils/inAppLoadingTasks'
import reportError from '../utils/reportError'
import {ensureSessionNotificationTokenExistsTaskId} from './notifications/ensureSessionNotificationTokenExistsTask'
import {forgetVexlSecretLocally} from './notifications/vexlNotificationTokenAtom'
import {dropPhoneNumbersFromSessionActionAtom} from './phoneNumbers/dropPhoneNumbersFromSessionActionAtom'
import {addLostPhoneNumbersToNoticeActionAtom} from './phoneNumbers/lostPhoneNumbersNotice'
import {clearDeviceAfterLoginOnAnotherDeviceActionAtom} from './resetLocalDataActionAtom'
import {sessionDataOrDummyAtom} from './session'
import {loginSessionWithProof} from './session/loginSession'
import {logoutActionAtom} from './useLogout'

export const refreshPhoneNumberOnContactService = ({
  session,
  contactApi,
  isMainPhoneNumber,
}: {
  session: SessionV2
  contactApi: ContactApi
  isMainPhoneNumber: boolean
}): Effect.Effect<
  void,
  CryptoError | Effect.Effect.Error<ReturnType<ContactApi['refreshUser']>>
> =>
  loginSessionWithProof(session).pipe(
    Effect.flatMap((loginSession) =>
      contactApi.refreshUser({
        offersAlive: true,
        // Only the main number gets pushes, a token on every number would
        // double them
        vexlNotificationToken: isMainPhoneNumber
          ? Option.fromNullable(session.sessionNotificationToken)
          : Option.none(),
        ...loginSession,
      })
    )
  )

type RefreshPhoneNumberError = Effect.Effect.Error<
  ReturnType<typeof refreshPhoneNumberOnContactService>
>

const handleRefreshError = (store: Store, e: RefreshPhoneNumberError): void => {
  Match.value(e).pipe(
    Match.tag('UserNotFoundError', 'LoggedInOnAnotherDeviceError', () => {
      // Handled for all numbers together, see checkAccountOnContactService
    }),
    Match.tags({
      ResponseError: () => {
        console.warn('🦋 Network error refreshing user. Not logging out.', e)
      },
      RequestError: () => {
        console.warn('🦋 Network error refreshing user. Not logging out.', e)
      },
    }),
    Match.tag('UnexpectedServerError', () => {
      reportError(
        'warn',
        new Error('Unknown error refreshing user. Not logging out.'),
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
      const codeStartsWith4XX = notFoundError.status.toString().startsWith('4')
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
          new Error('Bad status code error refreshing user. Not logging out.'),
          {e}
        )
      }
    }),
    Match.orElse(() => {
      reportError(
        'error',
        new Error('Uncaught error refreshing user. Not logging out.'),
        {e}
      )
      console.error(
        '🦋 🚨 UnexpectedApiResponseError error refreshing user. Not logging out.',
        {e}
      )
    })
  )
}

const checkAccountOnContactService = (
  store: Store
): Effect.Effect<void, LoggedInOnAnotherDeviceError> =>
  Effect.gen(function* (_) {
    const session = store.get(sessionDataOrDummyAtom)

    const failures = yield* _(
      Effect.forEach(
        store.get(phoneNumberContactApisAtom),
        ({phoneNumber, contactApi}, i) =>
          refreshPhoneNumberOnContactService({
            session,
            contactApi,
            isMainPhoneNumber: i === 0,
          }).pipe(
            Effect.flip,
            Effect.map((error) => ({phoneNumber, error})),
            Effect.option
          ),
        {concurrency: 'unbounded'}
      ),
      Effect.map(Array.getSomes)
    )

    if (
      Array.some(
        failures,
        ({error}) => error._tag === 'LoggedInOnAnotherDeviceError'
      )
    ) {
      console.log(
        '🦋 🚨 Account is active on another device. Clearing local data only.'
      )
      // Right away, before the wipe: the new device took over the
      // secret, a token sync from here would steal its pushes back.
      forgetVexlSecretLocally(store)
      void store.set(clearDeviceAfterLoginOnAnotherDeviceActionAtom)
      return yield* _(Effect.fail(new LoggedInOnAnotherDeviceError()))
    }

    // Someone logged in with these numbers elsewhere
    const lostPhoneNumbers = pipe(
      failures,
      Array.filter(({error}) => error._tag === 'UserNotFoundError'),
      Array.map(({phoneNumber}) => phoneNumber)
    )
    if (Array.isNonEmptyArray(lostPhoneNumbers)) {
      const dropped = store.set(
        dropPhoneNumbersFromSessionActionAtom,
        lostPhoneNumbers
      )
      if (Either.isRight(dropped)) {
        console.log('🦋 🚨 Some phone numbers not found. Dropping them.')
        store.set(addLostPhoneNumbersToNoticeActionAtom, lostPhoneNumbers)
      } else {
        console.log('🦋 🚨 User to refresh not found. Logging out')
        void store.set(logoutActionAtom)
      }
    }

    Array.forEach(failures, ({error}) => {
      handleRefreshError(store, error)
    })

    if (!Array.isNonEmptyArray(failures)) console.log('🦋 User refreshed')
  })

const latestAccountCheckAtom = atom<
  Option.Option<Fiber.RuntimeFiber<void, LoggedInOnAnotherDeviceError>>
>(Option.none())

/**
 * Also tells whether the account still lives on this device. When it moved to
 * another device, this device is cleared and the effect fails.
 */
export const refreshUserOnContactService = (
  store: Store
): Effect.Effect<void, LoggedInOnAnotherDeviceError> =>
  Effect.gen(function* () {
    const check = yield* Effect.forkDaemon(checkAccountOnContactService(store))
    store.set(latestAccountCheckAtom, Option.some(check))
    return yield* Fiber.join(check)
  })

/**
 * `afterRefreshUserUnlessAccountMoved` for pulls that don't run as resume
 * tasks, like the ones a notification starts: waits for a running check and
 * skips the pull when the account moved to another device.
 */
export const unlessAccountMoved = <A, E, R>(
  get: Getter,
  pull: Effect.Effect<A, E, R>
): Effect.Effect<Option.Option<A>, E, R> =>
  Effect.gen(function* () {
    const check = get(latestAccountCheckAtom)
    if (Option.isSome(check) && Exit.isFailure(yield* Fiber.await(check.value)))
      return Option.none()
    return Option.some(yield* pull)
  })

export const refreshUserOnContactServiceInAppBackgroundTaskId =
  registerInAppLoadingTask({
    name: 'refreshUserOnContactService',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    dependsOn: [{id: ensureSessionNotificationTokenExistsTaskId}],
    task: (store) =>
      refreshUserOnContactService(store).pipe(
        // Fails the task so tasks touching server data skip this device
        Effect.mapError(
          () =>
            new InAppLoadingTaskError({
              message: 'Account is active on another device',
            })
        )
      ),
  })

/**
 * For tasks that pull messages or change server data: a device whose account
 * moved to another device must not touch it. Network errors don't block them.
 */
export const afterRefreshUserUnlessAccountMoved: InAppLoadingTaskDependency = {
  id: refreshUserOnContactServiceInAppBackgroundTaskId,
  onlyIfSucceeds: true,
}
