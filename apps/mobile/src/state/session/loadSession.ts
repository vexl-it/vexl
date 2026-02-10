import {FetchHttpClient} from '@effect/platform/index'
import {type PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {contact} from '@vexl-next/rest-api/src'
import {Array, Effect, Either, Option, Record, Schedule} from 'effect/index'
import * as O from 'fp-ts/Option'
import {getDefaultStore} from 'jotai'
import {Alert, Linking} from 'react-native'
import {sessionAtom, sessionHolderAtom} from '.'
import {apiEnv, platform} from '../../api'
import {type Session} from '../../brands/Session.brand'
import {appSource, version, versionCode} from '../../utils/environment'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {showDebugNotificationIfEnabled} from '../../utils/notifications/showDebugNotificationIfEnabled'
import {isDeveloperAtom} from '../../utils/preferences'
import reportError, {reportErrorE} from '../../utils/reportError'
import {clubsToKeyHolderAtom} from '../clubs/atom/clubsToKeyHolderAtom'
import {ensureClubV2KeysExist} from '../clubs/atom/clubV2KeysAtom'
import {SECRET_TOKEN_KEY, SESSION_KEY} from './sessionKeys'
import {readSessionFromStorageE} from './utils/readSessionFromStorage'
import {ensureV2SessionKeysExist, V2KeySyncError} from './v2Keys'

function logLoadSessionProgress(text: string): void {
  console.log('🔑 loading session', text)
  void showDebugNotificationIfEnabled({
    title: 'Load session',
    subtitle: 'loadSessionProgress',
    body: text,
  })
}

let resolveSessionLoaded: () => void = () => {}
const sessionLoadedPromise = new Promise<void>(
  (resolve) => (resolveSessionLoaded = resolve)
)

/**
 * Syncs V2 public key to backend via refreshUser endpoint.
 * This ensures the backend has the user's V2 public key for offer encryption.
 */
function syncV2PublicKeyToBackend(
  publicKeyV2: PublicKeyV2,
  session: Session
): Effect.Effect<void, V2KeySyncError> {
  return Effect.gen(function* () {
    const store = getDefaultStore()

    const contactApi = yield* contact.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.contactMs,
      getUserSessionCredentials: () => session.sessionCredentials,
      appSource,
      language: store.get(translationAtom).t('localeName'),
      isDeveloper: store.get(isDeveloperAtom),
    })

    yield* Effect.tryPromise({
      try: async () => {
        await Effect.runPromise(
          contactApi.refreshUser({
            offersAlive: true,
            countryPrefix: Option.none(),
            publicKeyV2: Option.some(publicKeyV2),
          })
        )
      },
      catch: (e) => new V2KeySyncError('Failed to sync V2 public key', e),
    })
  }).pipe(Effect.provide(FetchHttpClient.layer))
}

/**
 * Syncs a club V2 public key to backend via getClubInfo endpoint.
 * The backend updates the club member's publicKeyV2 when this is called.
 */
function syncClubV2PublicKeyToBackend(
  clubUuid: ClubUuid,
  publicKeyV2: PublicKeyV2,
  session: Session
): Effect.Effect<void, V2KeySyncError> {
  return Effect.gen(function* () {
    const store = getDefaultStore()
    const clubsKeyHolder = store.get(clubsToKeyHolderAtom)
    const keyPair = clubsKeyHolder[clubUuid]

    if (!keyPair) {
      yield* Effect.logWarning(
        `Cannot sync V2 key for club ${clubUuid}: club keypair not found`
      )
      return
    }

    const contactApi = yield* contact.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.contactMs,
      getUserSessionCredentials: () => session.sessionCredentials,
      appSource,
      language: store.get(translationAtom).t('localeName'),
      isDeveloper: store.get(isDeveloperAtom),
    })

    yield* Effect.tryPromise({
      try: async () => {
        await Effect.runPromise(
          contactApi.getClubInfo({
            keyPair,
            notificationToken: Option.none(),
            publicKeyV2: Option.some(publicKeyV2),
          })
        )
      },
      catch: (e) =>
        new V2KeySyncError(
          `Failed to sync V2 public key for club ${clubUuid}`,
          e
        ),
    })
  }).pipe(Effect.provide(FetchHttpClient.layer))
}

const waitForLoadingSessionFinished = (
  timeoutMillis: number = 5_000
): Effect.Effect<boolean> => {
  return Effect.promise(async () => {
    await sessionLoadedPromise
  }).pipe(
    Effect.zipRight(Effect.succeed(true)),
    Effect.timeout(timeoutMillis),
    Effect.catchTag('TimeoutException', (e) =>
      Effect.zipRight(
        reportErrorE(
          'error',
          new Error('Waiting for sessionfinished timeout', {cause: e})
        ),
        Effect.succeed(false)
      )
    )
  )
}

export function loadSession(
  {
    showErrorAlert,
    forceReload,
  }: {
    showErrorAlert: boolean
    forceReload: boolean
  } = {
    showErrorAlert: false,
    forceReload: false,
  }
): Effect.Effect<boolean> {
  return Effect.gen(function* (_) {
    const store = getDefaultStore()
    const sessionState = store.get(sessionHolderAtom).state

    logLoadSessionProgress(
      `LoadingSession: ${JSON.stringify({
        showErrorAlert,
        forceReload,
        sessionState,
      })})}`
    )

    // Session is loading and we don't want to force reload.
    // In this case just wait until loading is finished
    if (sessionState === 'loading' && !forceReload) {
      logLoadSessionProgress(
        `Session is already loading. Result: ${sessionState}`
      )
      yield* _(waitForLoadingSessionFinished())
      const sessionStateCurrent = store.get(sessionHolderAtom).state
      logLoadSessionProgress(
        `Loading finished after callback. Result: ${sessionStateCurrent}`
      )
      return sessionStateCurrent === 'loggedIn'
    }

    if (
      !(
        sessionState === 'initial' ||
        (forceReload && sessionState !== 'loading')
      )
    ) {
      logLoadSessionProgress(
        `Skipping loadSession. Result: ${sessionState === 'loggedIn'}`
      )

      return store.get(sessionHolderAtom).state === 'loggedIn'
    }

    logLoadSessionProgress('Trying to find session in storage')
    getDefaultStore().set(sessionHolderAtom, {state: 'loading'})

    const sessionFromStorageE = yield* _(
      readSessionFromStorageE({
        asyncStorageKey: SESSION_KEY,
        secretStorageKey: SECRET_TOKEN_KEY,
      }),
      Effect.either
    )

    if (Either.isLeft(sessionFromStorageE)) {
      const loadingError = sessionFromStorageE.left
      logLoadSessionProgress(
        `Error while loading session ${JSON.stringify(loadingError)}`
      )

      if (loadingError._tag === 'StoreEmpty') {
        logLoadSessionProgress('No session in storage. User is logged out')
        getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})
        return false
      }

      reportError(
        'error',
        new Error(
          '‼️ Error while reading or parsing user data from secure storage.'
        ),
        {loadingError}
      )

      if (showErrorAlert) {
        const {t} = getDefaultStore().get(translationAtom)
        Alert.alert(
          t('errorGettingSession.title'),
          t('errorGettingSession.text', {errorCode: loadingError._tag}),
          [
            {
              text: t('errorGettingSession.contactSupport'),
              onPress: () => {
                void Linking.openURL(
                  `mailto:${t('settings.items.supportEmail')}`
                )
              },
            },
          ]
        )
      } else {
        getDefaultStore().set(sessionHolderAtom, {state: 'initial'})
      }

      return false
    }

    let session = sessionFromStorageE.right

    // Generate V2 keys if needed - this mutates the session
    // BLOCKING: App stays on loading screen until this completes successfully
    const sessionWithV2Keys = yield* Effect.gen(function* () {
      // Generate or get existing V2 keys
      logLoadSessionProgress('Ensuring V2 session keys exist')
      const updatedSession = yield* ensureV2SessionKeysExist(session).pipe(
        Effect.tapError((e) =>
          Effect.sync(() => {
            logLoadSessionProgress(
              `Failed to generate V2 session keys: ${e.message}`
            )
          })
        )
      )

      // If V2 keys were generated, persist the updated session
      if (!session.keyPairV2 && updatedSession.keyPairV2) {
        logLoadSessionProgress('Persisting session with new V2 keys')
        store.set(sessionAtom, O.some(updatedSession))
      }

      return updatedSession
    }).pipe(
      Effect.catchTag('V2KeyGenerationError', (e) =>
        // V2 key generation failure is critical - propagate error to show error screen
        Effect.zipRight(
          reportErrorE(
            'error',
            new Error('V2 key generation failed', {cause: e})
          ),
          // Return original session without V2 keys
          Effect.succeed(session)
        )
      )
    )

    // Update session reference with V2 keys
    session = sessionWithV2Keys

    logLoadSessionProgress('🎉 We have a session. User is logged in.')
    getDefaultStore().set(sessionHolderAtom, {
      state: 'loggedIn',
      session,
    })

    // Sync V2 public key to backend if it exists
    yield* Effect.gen(function* () {
      if (!session.keyPairV2) {
        logLoadSessionProgress('No V2 keys to sync to backend')
        return
      }

      // Sync public key to backend via refreshUser
      // MUST succeed before app proceeds - keep retrying indefinitely
      logLoadSessionProgress('Syncing V2 public key to backend')
      yield* syncV2PublicKeyToBackend(
        session.keyPairV2.publicKey,
        session
      ).pipe(
        Effect.tapError((e) =>
          Effect.sync(() => {
            logLoadSessionProgress(
              `V2 key sync attempt failed: ${e.message}, retrying...`
            )
          })
        ),
        // Retry indefinitely with exponential backoff (capped at 30 seconds)
        // User sees loading screen during this time
        Effect.retry({
          schedule: Schedule.exponential('1 second').pipe(
            Schedule.jittered,
            Schedule.union(Schedule.spaced('30 seconds'))
          ),
        })
      )

      logLoadSessionProgress('V2 session keys synced successfully')

      // Ensure existing clubs have V2 keys and sync to backend
      yield* Effect.gen(function* () {
        // Get existing club memberships
        const clubsKeyHolder = store.get(clubsToKeyHolderAtom)
        const clubUuids = Record.keys(clubsKeyHolder)

        if (!Array.isNonEmptyArray(clubUuids)) {
          logLoadSessionProgress('No existing clubs to migrate V2 keys for')
          return
        }

        logLoadSessionProgress(
          `Checking V2 keys for ${clubUuids.length} existing clubs`
        )

        // Generate V2 keys for any clubs that don't have them
        const newKeys = yield* ensureClubV2KeysExist(clubUuids).pipe(
          Effect.catchAll((e) => {
            // Log but don't fail - keys can be generated later
            logLoadSessionProgress(
              `Failed to generate V2 keys for some clubs: ${e.message}`
            )
            return Effect.succeed([])
          })
        )

        // Sync new V2 keys to backend for each club
        for (const {clubUuid, keypair} of newKeys) {
          yield* syncClubV2PublicKeyToBackend(
            clubUuid,
            keypair.publicKey,
            session
          ).pipe(
            Effect.tapError((e) =>
              Effect.sync(() => {
                logLoadSessionProgress(
                  `Failed to sync V2 key for club ${clubUuid}: ${e.message}`
                )
              })
            ),
            Effect.catchAll((e) => {
              // Log but continue - sync will retry on next refresh
              reportError(
                'warn',
                new Error(`Failed to sync V2 key for club ${clubUuid}`, {
                  cause: e,
                })
              )
              return Effect.succeed(undefined)
            })
          )
        }

        if (Array.isNonEmptyArray(newKeys)) {
          logLoadSessionProgress(
            `V2 keys generated and synced for ${newKeys.length} existing clubs`
          )
        }
      })
    }).pipe(
      // V2KeySyncError is handled by retry - if we get here without error, sync succeeded
      Effect.catchTag(
        'V2KeySyncError',
        () =>
          // This should never be reached due to infinite retry, but handle gracefully
          Effect.void
      ),
      // Ignore errors to not break session loading - V2 keys are optional for now
      Effect.catchAll(() => Effect.void)
    )

    resolveSessionLoaded()

    return true
  })
}
