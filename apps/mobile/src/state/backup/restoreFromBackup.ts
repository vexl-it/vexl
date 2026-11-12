import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubKeys, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {generateLoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {KeyDerivationIndex} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {
  type VexlNotificationToken,
  type VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type BackupFile} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {GenerateNotificationTokenRequest} from '@vexl-next/rest-api/src/services/notification/contract'
import {Array, Effect, Either, Option, pipe, Record, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {
  contactApiForPhoneNumber,
  userApiForPhoneNumber,
} from '../../api/contactApiForSession'
import {
  sanityCheckSessionV2,
  type ExtraSessionPhoneNumber,
  type SessionPhoneNumber,
  type SessionV2,
} from '../../brands/Session.brand'
import {getNotificationTokenE} from '../../utils/notifications'
import {
  showCheckUpdatedPrivacyPolicySuggestionAtom,
  showMarketplaceIntroDialogAtom,
} from '../../utils/preferences'
import reportError, {reportErrorE} from '../../utils/reportError'
import messagingStateAtom, {
  messagingStateAtomStorageAtom,
} from '../chat/atoms/messagingStateAtom'
import {type InboxInState, type MessagingState} from '../chat/domain'
import {
  clubsKeyHolderStorageAtom,
  type ClubsToKeyHolderV2,
} from '../clubs/atom/clubsToKeyHolderV2Atom'
import {defaultCurrencyBaseOnCountryCodeActionAtom} from '../defaultCurrencyBaseOnCountryCodeActionAtom'
import {
  raiseKeyDerivationCountersActionAtom,
  type KeyDerivationCounters,
} from '../keyDerivation'
import {
  findClubUuidOfMember,
  scanClubs,
  scanInboxes,
  type FoundClub,
} from '../keyDerivation/scanDerivedKeys'
import {refreshOffersActionAtom} from '../marketplace/atoms/refreshOffersActionAtom'
import {updateOfferNotificationTokensActionAtom} from '../marketplace/checkNotificationTokensAndVersionsAndUpdateOffersTask'
import {refreshNotesActionAtom} from '../notes/atoms/refreshNotesActionAtom'
import {createVexlSecretAndSessionTokenActionAtom} from '../notifications/actions/createVexlSecretAndSessionTokenActionAtom'
import {invalidateVexlSecretActionAtom} from '../notifications/actions/invalidateVexlSecretActionAtom'
import {syncVexlNotificationTokensActionAtom} from '../notifications/actions/syncVexlNotificationTokensActionAtom'
import {vexlNotificationTokenAtom} from '../notifications/vexlNotificationTokenAtom'
import {postLoginFlowCompletedScreensAtom} from '../postLoginOnboarding'
import {sessionHolderAtom} from '../session'
import {loginSessionWithProof} from '../session/loginSession'
import {mainPhoneNumberOfSession} from '../session/sessionPhoneNumbers'
import writeSessionToStorage, {
  type SessionWriteError,
} from '../session/utils/writeSessionToStorage'
import {restoredNotificationSecretState} from './backupNotificationSecret'
import {clearBackupToRestoreActionAtom} from './backupToRestore'
import {restoredUserData} from './backupUserData'

export class InvalidBackupSessionError extends Schema.TaggedError<InvalidBackupSessionError>(
  'InvalidBackupSessionError'
)('InvalidBackupSessionError', {}) {}

export interface RestoredAccount {
  readonly session: SessionV2
  readonly inboxKeys: readonly PrivateKeyHolder[]
  readonly clubKeys: ClubsToKeyHolderV2
  readonly counters: KeyDerivationCounters
}

export type RestoreFailure = 'backupNoLongerValid' | 'offline' | 'unknown'

export type RestoreFromBackupState =
  | {readonly state: 'idle'}
  | {readonly state: 'restoring'}
  | {readonly state: 'failed'; readonly failure: RestoreFailure}

export const restoredSession = (
  backup: BackupFile
): Effect.Effect<SessionV2, InvalidBackupSessionError> => {
  const {realUserData: _restoredLater, ...backupSession} = backup.session
  const session: SessionV2 = {
    ...backupSession,
    version: 1,
    masterSeed: backup.masterSeed,
    loginSessionId: generateLoginSessionId(),
  }
  return sanityCheckSessionV2(session)
    ? Effect.succeed(session)
    : Effect.fail(new InvalidBackupSessionError())
}

// Legacy club keys win over a scanned key for the same club.
export const restoredClubKeys = (
  backup: BackupFile,
  foundClubs: readonly FoundClub[]
): ClubsToKeyHolderV2 => ({
  data: pipe(
    foundClubs,
    Array.map(({clubUuid, keys}): [ClubUuid, ClubKeys] => [clubUuid, keys]),
    Record.fromEntries,
    Record.union(backup.legacyClubKeys, (_, legacy) => legacy)
  ),
  waitingForAdmission: backup.legacyClubKeysWaitingForAdmission,
})

// Chats come back once the other side writes to these inboxes.
export const withRestoredInboxes = (
  messagingState: MessagingState,
  inboxKeys: readonly PrivateKeyHolder[]
): MessagingState => {
  const knownPublicKeys = Array.map(
    messagingState,
    (one) => one.inbox.privateKey.publicKeyPemBase64
  )
  const restoredInboxes = pipe(
    inboxKeys,
    Array.dedupeWith((a, b) => a.publicKeyPemBase64 === b.publicKeyPemBase64),
    Array.filter(
      (key) => !Array.contains(knownPublicKeys, key.publicKeyPemBase64)
    ),
    Array.map(
      (privateKey): InboxInState => ({
        inbox: {privateKey},
        chats: [],
        restoredFromBackup: true,
        restoredAt: unixMillisecondsNow(),
      })
    )
  )
  return [...messagingState, ...restoredInboxes]
}

// Past every index the backup knows, also of numbers that won't be restored:
// user-service may still hold their keys, and a key registers there only once.
export const nextPhoneNumberIndexAfter = (
  backup: BackupFile
): KeyDerivationIndex | undefined =>
  pipe(
    backup.session.extraPhoneNumbers ?? [],
    Array.map((one) => one.keyDerivationIndex + 1),
    Array.appendAll(
      Option.toArray(
        Option.fromNullable(backup.derivationCounters?.nextPhoneNumberIndex)
      )
    ),
    Array.match({
      onEmpty: () => undefined,
      onNonEmpty: (indexes) => KeyDerivationIndex.make(Math.max(...indexes)),
    })
  )

// Read-only on the server, so a failure here leaves the account untouched.
const scanRestorableKeysActionAtom = atom(
  null,
  (get, _, {backup, session}: {backup: BackupFile; session: SessionV2}) =>
    Effect.gen(function* () {
      const api = get(apiAtom)
      const [inboxes, clubs] = yield* Effect.all(
        [
          scanInboxes({
            masterSeed: session.masterSeed,
            chatApi: api.chat,
            scanAtLeastTo: backup.derivationCounters?.nextInboxIndex,
          }),
          scanClubs({
            masterSeed: session.masterSeed,
            findClubUuid: findClubUuidOfMember(api.contact),
            scanAtLeastTo: backup.derivationCounters?.nextClubIndex,
          }),
        ],
        {concurrency: 'unbounded'}
      )

      return {
        session,
        inboxKeys: [
          session.privateKey,
          ...backup.legacyInboxKeys,
          ...inboxes.found,
        ],
        clubKeys: restoredClubKeys(backup, clubs.found),
        counters: {
          nextInboxIndex: inboxes.nextIndex,
          nextClubIndex: clubs.nextIndex,
          nextPhoneNumberIndex: nextPhoneNumberIndexAfter(backup),
        },
      } satisfies RestoredAccount
    })
)

// Throws away a notification secret minted for a restore that didn't finish.
const discardVexlSecretActionAtom = atom(null, (_, set) =>
  set(invalidateVexlSecretActionAtom).pipe(
    Effect.ignore,
    Effect.zipRight(
      Effect.sync(() => {
        set(vexlNotificationTokenAtom, {
          secret: null,
          systemVexlToken: null,
          marketingVexlToken: null,
          lastUpdatedMetadata: null,
        })
      })
    )
  )
)

export interface RestoredAccountInfo {
  // Numbers contact-service no longer knows, left out of the restored account.
  readonly notRestoredPhoneNumbers: readonly E164PhoneNumber[]
}

// In memory only: after an app kill the info screen is simply skipped.
export const restoredAccountInfoAtom = atom<Option.Option<RestoredAccountInfo>>(
  Option.none()
)

const commitRestoredAccountActionAtom = atom(
  null,
  (
    get,
    set,
    {
      account: {session, inboxKeys, clubKeys, counters},
      takenOverSecret,
      notRestoredPhoneNumbers,
    }: {
      account: RestoredAccount
      // None when a new secret was minted instead.
      takenOverSecret: Option.Option<VexlNotificationTokenSecret>
      notRestoredPhoneNumbers: readonly ExtraSessionPhoneNumber[]
    }
  ): Effect.Effect<void, SessionWriteError> =>
    Effect.gen(function* () {
      // restoreUser already replaced the old device, so a session that can't be
      // stored fails the restore before anything else is kept.
      yield* writeSessionToStorage(session)

      // Before the session exists, so nothing can allocate a key from stale counters.
      set(raiseKeyDerivationCountersActionAtom, counters)

      if (Option.isSome(takenOverSecret)) {
        set(
          vexlNotificationTokenAtom,
          restoredNotificationSecretState(takenOverSecret.value)
        )
        vexlNotificationTokenAtom.flushNow()
      }

      set(messagingStateAtom, (state) => withRestoredInboxes(state, inboxKeys))
      messagingStateAtomStorageAtom.flushNow()
      set(clubsKeyHolderStorageAtom, clubKeys)
      clubsKeyHolderStorageAtom.flushNow()

      // The server-side user, inbox and profile choice already exist. Contacts
      // import and notifications stay, contacts give back the local names.
      set(postLoginFlowCompletedScreensAtom, ['usageInfo'])
      set(showCheckUpdatedPrivacyPolicySuggestionAtom, false)
      // A returning user knows the marketplace.
      set(showMarketplaceIntroDialogAtom, false)
      set(
        restoredAccountInfoAtom,
        Option.some({
          notRestoredPhoneNumbers: Array.map(
            notRestoredPhoneNumbers,
            (one) => one.phoneNumber
          ),
        })
      )

      // Already stored above, so not through sessionAtom, which stores it again.
      set(sessionHolderAtom, {state: 'loggedIn', session})
      set(defaultCurrencyBaseOnCountryCodeActionAtom)

      // Someone else may have verified these numbers since, leaving their
      // user-service rows under this account's keys behind.
      Effect.runFork(
        Effect.forEach(
          notRestoredPhoneNumbers,
          (one) => Effect.ignore(userApiForPhoneNumber(get, one).deleteUser()),
          {discard: true}
        )
      )

      // Own offers and notes come back with ownership, which links them to
      // their restored inboxes, for every restored number. Don't wait for the
      // marketplace screen.
      // Without the old secret, own offers still point to the old device.
      Effect.runFork(
        Effect.all(
          [
            set(refreshOffersActionAtom).pipe(
              Effect.zipRight(
                Option.isNone(takenOverSecret)
                  ? set(updateOfferNotificationTokensActionAtom, {
                      regenerateAll: true,
                    })
                  : Effect.void
              )
            ),
            set(refreshNotesActionAtom),
          ],
          {concurrency: 'unbounded'}
        )
      )
    })
)

interface RestoredUser {
  // Without the extra numbers contact-service no longer knows.
  readonly session: SessionV2
  readonly notRestoredPhoneNumbers: readonly ExtraSessionPhoneNumber[]
}

const restorePhoneNumberActionAtom = atom(
  null,
  (
    get,
    _,
    {
      session,
      phoneNumber,
      vexlNotificationToken,
    }: {
      session: SessionV2
      phoneNumber: SessionPhoneNumber
      vexlNotificationToken: Option.Option<VexlNotificationToken>
    }
  ) =>
    loginSessionWithProof({
      loginSessionId: session.loginSessionId,
      privateKey: phoneNumber.privateKey,
    }).pipe(
      Effect.flatMap((loginSession) =>
        // Never createUser here - it would wipe the user's contacts on the server.
        contactApiForPhoneNumber(get, phoneNumber).restoreUser({
          ...loginSession,
          vexlNotificationToken,
        })
      )
    )
)

// The main number goes first and carries the account: when contact-service no
// longer knows it, the backup is no longer valid. Extra numbers it no longer
// knows are left out. A failure leaves the numbers restored so far pointing to
// a login session nobody holds. Trying again restores all of them under a new one.
const restoreUserActionAtom = atom(null, (_, set, session: SessionV2) =>
  Effect.gen(function* () {
    yield* set(restorePhoneNumberActionAtom, {
      session,
      phoneNumber: mainPhoneNumberOfSession(session),
      // Only the main number gets pushes.
      vexlNotificationToken: Option.fromNullable(
        session.sessionNotificationToken
      ),
    })

    const [notRestored, restored] = Array.separate(
      yield* Effect.forEach(session.extraPhoneNumbers ?? [], (phoneNumber) =>
        set(restorePhoneNumberActionAtom, {
          session,
          phoneNumber,
          vexlNotificationToken: Option.none(),
        }).pipe(
          Effect.as(Either.right(phoneNumber)),
          Effect.catchTag('UserNotFoundError', () =>
            Effect.succeed(Either.left(phoneNumber))
          )
        )
      )
    )

    return {
      session: Array.isNonEmptyReadonlyArray(notRestored)
        ? {...session, extraPhoneNumbers: restored}
        : session,
      notRestoredPhoneNumbers: notRestored,
    } satisfies RestoredUser
  })
)

interface SecretToTakeOver {
  readonly secret: VexlNotificationTokenSecret
  readonly sessionNotificationToken: VexlNotificationToken
}

// Minting the session token also proves the server still knows the secret.
// None when the backup has none or it is gone - a new one is minted then.
const secretToTakeOverActionAtom = atom(null, (get, _, backup: BackupFile) => {
  if (!backup.notificationSecret) return Effect.succeedNone
  const {secret} = backup.notificationSecret

  return get(apiAtom)
    .notification.generateNotificationToken(
      new GenerateNotificationTokenRequest({secret})
    )
    .pipe(
      Effect.map(({token}) =>
        Option.some<SecretToTakeOver>({
          secret,
          sessionNotificationToken: token,
        })
      ),
      Effect.catchTag('NotFoundError', () => Effect.succeedNone)
    )
})

// Points the old device's secret at this device, so every token already
// handed out keeps working. The old device forgets it locally.
const takeOverNotificationSecretActionAtom = atom(
  null,
  (_, set, expoToken: ExpoNotificationToken | null) =>
    set(syncVexlNotificationTokensActionAtom, {
      expoNotificationToken: expoToken,
    }).pipe(
      // Retried on every resume by refreshVexlTokenMetadataTask.
      Effect.catchAll((e) =>
        reportErrorE(
          'warn',
          new Error('Error taking over the notification secret'),
          {errorTag: e._tag}
        )
      )
    )
)

// restoreUser rotates the login nonce, which wipes the old device on its next
// start. It goes last, and the account is stored right after it, so a restore
// that fails earlier leaves both the old device and this one as they were.
const restoreAccountActionAtom = atom(null, (get, set, backup: BackupFile) =>
  Effect.gen(function* () {
    const backupSession = yield* restoredSession(backup)
    const account = yield* set(scanRestorableKeysActionAtom, {
      backup,
      session: backupSession,
    })
    const withSession = (session: SessionV2): RestoredAccount => ({
      ...account,
      // Writes the avatar file, so only once the restore went through.
      session: {
        ...session,
        realUserData: restoredUserData(backup.session.realUserData),
      },
    })

    const secretToTakeOver = yield* set(secretToTakeOverActionAtom, backup)
    if (Option.isSome(secretToTakeOver)) {
      const {secret, sessionNotificationToken} = secretToTakeOver.value
      const {session, notRestoredPhoneNumbers} = yield* set(
        restoreUserActionAtom,
        {...backupSession, sessionNotificationToken}
      )

      yield* set(commitRestoredAccountActionAtom, {
        account: withSession(session),
        takenOverSecret: Option.some(secret),
        notRestoredPhoneNumbers,
      })
      yield* set(
        takeOverNotificationSecretActionAtom,
        yield* getNotificationTokenE()
      )
      return
    }

    const {session, notRestoredPhoneNumbers} = yield* Effect.gen(function* () {
      const {sessionNotificationToken} = yield* set(
        createVexlSecretAndSessionTokenActionAtom
      )
      return yield* set(restoreUserActionAtom, {
        ...backupSession,
        sessionNotificationToken: Option.getOrUndefined(
          sessionNotificationToken
        ),
      })
    }).pipe(Effect.tapError(() => set(discardVexlSecretActionAtom)))

    yield* set(commitRestoredAccountActionAtom, {
      account: withSession(session),
      takenOverSecret: Option.none(),
      notRestoredPhoneNumbers,
    })
  })
)

const toRestoreFailure = (e: {
  readonly _tag: string
  readonly reason?: unknown
}): RestoreFailure => {
  if (e._tag === 'UserNotFoundError') return 'backupNoLongerValid'
  if (
    e._tag === 'NetworkError' ||
    (e._tag === 'RequestError' && e.reason === 'Transport')
  )
    return 'offline'
  return 'unknown'
}

export const restoreFromBackupStateAtom = atom<RestoreFromBackupState>({
  state: 'idle',
})

export const startRestoreFromBackupActionAtom = atom(
  null,
  (get, set, backup: BackupFile): Effect.Effect<void> => {
    if (get(restoreFromBackupStateAtom).state === 'restoring')
      return Effect.void
    set(restoreFromBackupStateAtom, {state: 'restoring'})

    return set(restoreAccountActionAtom, backup).pipe(
      Effect.match({
        onSuccess: () => {
          set(clearBackupToRestoreActionAtom)
          set(restoreFromBackupStateAtom, {state: 'idle'})
        },
        onFailure: (e) => {
          const failure = toRestoreFailure(e)
          // Only the tag - the error could carry key material.
          if (failure === 'unknown')
            reportError('error', new Error('Error restoring from backup'), {
              errorTag: e._tag,
            })
          set(restoreFromBackupStateAtom, {state: 'failed', failure})
        },
      })
    )
  }
)
