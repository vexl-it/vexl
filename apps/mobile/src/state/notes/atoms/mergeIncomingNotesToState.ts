import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type NoteId,
  type NoteInfo,
  type OneNoteInState,
} from '@vexl-next/domain/src/general/notes'
import {type SocialPartsByIdentity} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe, Record} from 'effect'
import {
  socialPartOf,
  socialPartsByIdentityOf,
  storedSocialPartsByIdentity,
  unionOfSocialParts,
  withoutIdentities,
} from '../../phoneNumbers/socialPartsByIdentity'

const EXPIRY_PURGE_GRACE_MS = 24 * 60 * 60 * 1000

export interface NoteForIdentity {
  readonly identity: PublicKeyPemBase64
  readonly noteInfo: NoteInfo
}

interface IncomingNote {
  readonly noteInfo: NoteInfo
  readonly socialPartsByIdentity: SocialPartsByIdentity
}

// The server returns one entry per private part, so the same note can appear
// multiple times (delivered directly and via one or more reposts, and to more
// phone numbers of the user). Prefer the non-repost part so a direct trust
// tier / common friends are shown.
const toIncomingNotes = (
  notes: readonly NoteForIdentity[]
): ReadonlyMap<NoteId, IncomingNote> =>
  new Map(
    pipe(
      notes,
      Array.groupBy((one) => one.noteInfo.noteId),
      Record.values,
      Array.map((group): [NoteId, IncomingNote] => {
        const noteInfo = pipe(
          Array.findFirst(group, (one) => !one.noteInfo.privatePart.viaRepost),
          Option.getOrElse(() => Array.headNonEmpty(group))
        ).noteInfo
        return [
          noteInfo.noteId,
          {
            noteInfo,
            socialPartsByIdentity: socialPartsByIdentityOf(
              Array.map(group, (one) => ({
                identity: one.identity,
                part: socialPartOf(one.noteInfo.privatePart),
              }))
            ),
          },
        ]
      })
    )
  )

const withSocialParts = (
  noteInfo: NoteInfo,
  socialPartsByIdentity: SocialPartsByIdentity
): NoteInfo => {
  const social = unionOfSocialParts(Record.values(socialPartsByIdentity))
  return {
    ...noteInfo,
    privatePart: {
      ...noteInfo.privatePart,
      friendLevel: social.friendLevel,
      commonFriends: social.commonFriends,
      verifiedCommonFriends: social.verifiedCommonFriends,
      viaRepost: social.viaRepost ?? noteInfo.privatePart.viaRepost,
    },
  }
}

/**
 * A note stays while any phone number of the user still has a private part
 * for it. My own notes are managed locally and never touched.
 */
export const mergeIncomingNotesToState = ({
  incomingNotes,
  storedNotes,
  removedNoteIds,
  mainIdentity,
}: {
  incomingNotes: readonly NoteForIdentity[]
  storedNotes: readonly OneNoteInState[]
  // Notes that have no private part for the identity anymore
  removedNoteIds: ReadonlyArray<{
    identity: PublicKeyPemBase64
    removedIds: readonly NoteId[]
  }>
  // Notes stored before identities were tracked came to this one
  mainIdentity: PublicKeyPemBase64
}): OneNoteInState[] => {
  const incomingById = toIncomingNotes(incomingNotes)
  const removedIdentitiesOf = (noteId: NoteId): PublicKeyPemBase64[] =>
    Array.filterMap(removedNoteIds, ({identity, removedIds}) =>
      Array.contains(removedIds, noteId) ? Option.some(identity) : Option.none()
    )

  const mergedStoredNotes = Array.filterMap(
    storedNotes,
    (stored): Option.Option<OneNoteInState> => {
      if (stored.ownershipInfo?.adminId) return Option.some(stored)

      const incoming = incomingById.get(stored.noteInfo.noteId)
      const removedFor = removedIdentitiesOf(stored.noteInfo.noteId)
      if (incoming === undefined && Array.isEmptyArray(removedFor))
        return Option.some(stored)

      const socialPartsByIdentity = withoutIdentities(
        {
          ...storedSocialPartsByIdentity({
            socialPartsByIdentity: stored.socialPartsByIdentity,
            legacyPart: Option.some(socialPartOf(stored.noteInfo.privatePart)),
            mainIdentity,
          }),
          ...incoming?.socialPartsByIdentity,
        },
        removedFor
      )
      if (Record.isEmptyRecord(socialPartsByIdentity)) return Option.none()

      // Preserve local flags / repostInfo across refreshes.
      return Option.some({
        ...stored,
        socialPartsByIdentity,
        noteInfo: withSocialParts(
          incoming?.noteInfo ?? stored.noteInfo,
          socialPartsByIdentity
        ),
      })
    }
  )

  const storedIds = new Set(
    Array.map(storedNotes, (one) => one.noteInfo.noteId)
  )
  const newNotes = pipe(
    Array.fromIterable(incomingById.values()),
    Array.filter(({noteInfo}) => !storedIds.has(noteInfo.noteId)),
    Array.map(({noteInfo, socialPartsByIdentity}): OneNoteInState => {
      // The owner's private payload carries the adminId, so ownership can be
      // restored even without local state (reinstall / another device).
      const adminId = noteInfo.privatePart.adminId
      return adminId
        ? {noteInfo, flags: {reported: false}, ownershipInfo: {adminId}}
        : {noteInfo, flags: {reported: false}, socialPartsByIdentity}
    })
  )

  // Purge notes (incl. my own) long after expiry so storage does not grow
  // forever. The UI already hides expired notes at render time; the grace
  // period only guards against device clock skew.
  return Array.filter(
    [...mergedStoredNotes, ...newNotes],
    (one) => one.noteInfo.expiresAt > Date.now() - EXPIRY_PURGE_GRACE_MS
  )
}
