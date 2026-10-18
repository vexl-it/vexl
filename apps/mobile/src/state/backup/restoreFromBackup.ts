import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubKeys, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {generateLoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type BackupFile} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Array, Effect, Option, pipe, Record, Schema} from 'effect'
import * as O from 'fp-ts/Option'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {contactApiForSession} from '../../api/contactApiForSession'
import {sanityCheckSessionV2, type SessionV2} from '../../brands/Session.brand'
import {showCheckUpdatedPrivacyPolicySuggestionAtom} from '../../utils/preferences'
import reportError from '../../utils/reportError'
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
import {refreshNotesActionAtom} from '../notes/atoms/refreshNotesActionAtom'
import {createVexlSecretAndSessionTokenActionAtom} from '../notifications/actions/createVexlSecretAndSessionTokenActionAtom'
import {postLoginFlowCompletedScreensAtom} from '../postLoginOnboarding'
import {sessionAtom} from '../session'

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
  | {readonly state: 'restored'; readonly account: RestoredAccount}
  | {readonly state: 'failed'; readonly failure: RestoreFailure}

export const restoredSession = ({
  backup,
  sessionNotificationToken,
}: {
  backup: BackupFile
  sessionNotificationToken: Option.Option<VexlNotificationToken>
}): Effect.Effect<SessionV2, InvalidBackupSessionError> => {
  const session: SessionV2 = {
    ...backup.session,
    version: 1,
    masterSeed: backup.masterSeed,
    loginSessionId: generateLoginSessionId(),
    sessionNotificationToken: Option.getOrUndefined(sessionNotificationToken),
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
      })
    )
  )
  return [...messagingState, ...restoredInboxes]
}

// Talks to the server only. Nothing is stored until the restore is committed,
// so an abandoned restore leaves no account data on the device.
export const prepareRestoreFromBackupActionAtom = atom(
  null,
  (get, set, backup: BackupFile) =>
    Effect.gen(function* () {
      const {expoToken, sessionNotificationToken} = yield* set(
        createVexlSecretAndSessionTokenActionAtom
      )
      const session = yield* restoredSession({
        backup,
        sessionNotificationToken,
      })

      // Never createUser here - it would wipe the user's contacts on the server.
      yield* contactApiForSession(get, session).restoreUser({
        loginSessionId: session.loginSessionId,
        vexlNotificationToken: sessionNotificationToken,
        expoToken: Option.fromNullable(expoToken),
      })

      const api = get(apiAtom)
      const [inboxes, clubs] = yield* Effect.all(
        [
          scanInboxes({masterSeed: session.masterSeed, chatApi: api.chat}),
          scanClubs({
            masterSeed: session.masterSeed,
            findClubUuid: findClubUuidOfMember({
              contactApi: api.contact,
              notificationToken: Option.fromNullable(expoToken),
            }),
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
        },
      } satisfies RestoredAccount
    })
)

export const commitRestoredAccountActionAtom = atom(
  null,
  (get, set, {session, inboxKeys, clubKeys, counters}: RestoredAccount) => {
    // Before the session exists, so nothing can allocate a key from stale counters.
    set(raiseKeyDerivationCountersActionAtom, counters)

    set(messagingStateAtom, (state) => withRestoredInboxes(state, inboxKeys))
    messagingStateAtomStorageAtom.flushNow()
    set(clubsKeyHolderStorageAtom, clubKeys)
    clubsKeyHolderStorageAtom.flushNow()

    // The server-side user, inbox and profile choice already exist. Contacts
    // import and notifications stay, contacts give back the local names.
    set(postLoginFlowCompletedScreensAtom, ['usageInfo'])
    set(showCheckUpdatedPrivacyPolicySuggestionAtom, false)

    set(sessionAtom, O.some(session))
    set(defaultCurrencyBaseOnCountryCodeActionAtom)

    // Own offers and notes come back with ownership, which links them to
    // their restored inboxes. Don't wait for the marketplace screen.
    Effect.runFork(
      Effect.all([set(refreshOffersActionAtom), set(refreshNotesActionAtom)], {
        concurrency: 'unbounded',
      })
    )
  }
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

    return set(prepareRestoreFromBackupActionAtom, backup).pipe(
      Effect.match({
        onSuccess: (account) => {
          set(restoreFromBackupStateAtom, {state: 'restored', account})
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

export const finishRestoreFromBackupActionAtom = atom(null, (get, set) => {
  const restoreState = get(restoreFromBackupStateAtom)
  set(restoreFromBackupStateAtom, {state: 'idle'})
  if (restoreState.state === 'restored')
    set(commitRestoredAccountActionAtom, restoreState.account)
})
