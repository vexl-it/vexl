import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type NoteId,
  type OneNoteInState,
} from '@vexl-next/domain/src/general/notes'
import {isoNow} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import decryptNote from '@vexl-next/resources-utils/src/notes/decryptNote'
import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Either, Fiber, Option, pipe, Record} from 'effect'
import {atom} from 'jotai'
import {phoneNumberApisAtom} from '../../../api/contactApiForSession'
import {type SessionPhoneNumber} from '../../../brands/Session.brand'
import reportError from '../../../utils/reportError'
import {linkRestoredInboxesToMyOffersAndNotesActionAtom} from '../../backup/linkRestoredInboxesActionAtom'
import {
  socialPartOf,
  storedSocialPartsByIdentity,
} from '../../phoneNumbers/socialPartsByIdentity'
import {identityKeyOfPhoneNumber} from '../../session/sessionPhoneNumbers'
import {
  mergeIncomingNotesToState,
  type NoteForIdentity,
} from './mergeIncomingNotesToState'
import {notesAtom, notesNextPageParamAtom, notesStateAtom} from './notesState'

const NOTES_PAGE_LIMIT = 30

const fetchNotesOfPhoneNumber = ({
  phoneNumber,
  offerApi,
  cursor,
}: {
  phoneNumber: SessionPhoneNumber
  offerApi: OfferApi
  cursor: string | undefined
}): Effect.Effect<
  {notes: readonly NoteForIdentity[]; nextCursor: string | undefined},
  Effect.Effect.Error<
    ReturnType<OfferApi['getNotesForMeModifiedOrCreatedAfterPaginated']>
  >
> =>
  Effect.gen(function* (_) {
    let nextCursor = cursor
    const serverNotes = yield* _(
      fetchAllPaginatedData({
        fetchEffectToRun: (nextPageToken) =>
          offerApi.getNotesForMeModifiedOrCreatedAfterPaginated({
            nextPageToken: nextPageToken ?? cursor,
            limit: NOTES_PAGE_LIMIT,
          }),
        storeNextPageToken: (nextPageToken) => {
          nextCursor = nextPageToken
        },
      })
    )

    const decryptResults = yield* _(
      serverNotes,
      Array.map((serverNote) =>
        Effect.either(
          decryptNote(phoneNumber.privateKey, phoneNumber.keyPairV2)(serverNote)
        )
      ),
      Effect.all
    )

    const identity = identityKeyOfPhoneNumber(phoneNumber)
    const notes = Array.filterMap(decryptResults, (result) => {
      if (Either.isRight(result))
        return Option.some({identity, noteInfo: result.right})
      if (result.left._tag === 'DecryptingNoteError') {
        reportError('error', new Error('Error while decrypting note'), {
          error: result.left,
        })
      }
      return Option.none()
    })

    return {notes, nextCursor}
  })

const getRemovedNoteIdsOfPhoneNumber = ({
  phoneNumber,
  offerApi,
  storedNotes,
  mainIdentity,
}: {
  phoneNumber: SessionPhoneNumber
  offerApi: OfferApi
  storedNotes: readonly OneNoteInState[]
  mainIdentity: PublicKeyPemBase64
}): Effect.Effect<{
  identity: PublicKeyPemBase64
  removedIds: readonly NoteId[]
}> => {
  const identity = identityKeyOfPhoneNumber(phoneNumber)
  // Only notes this number received, not owned by me
  const knownForeignNoteIds = pipe(
    storedNotes,
    Array.filter(
      (one) =>
        !one.ownershipInfo?.adminId &&
        Record.has(
          storedSocialPartsByIdentity({
            socialPartsByIdentity: one.socialPartsByIdentity,
            legacyPart: Option.some(socialPartOf(one.noteInfo.privatePart)),
            mainIdentity,
          }),
          identity
        )
    ),
    Array.map((one) => one.noteInfo.noteId)
  )

  return pipe(
    Array.isNonEmptyReadonlyArray(knownForeignNoteIds)
      ? offerApi
          .getRemovedNotes({noteIds: knownForeignNoteIds})
          .pipe(Effect.map((res) => res.noteIds))
      : Effect.succeed<readonly NoteId[]>([]),
    Effect.catchAll((e) => {
      reportError('error', new Error('Error fetching removed notes'), {e})
      return Effect.succeed<readonly NoteId[]>([])
    }),
    Effect.map((removedIds) => ({identity, removedIds}))
  )
}

const runRefreshNotesActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const updateStartedAt = isoNow()
    const storedNotes = get(notesAtom)
    const [main, ...extras] = get(phoneNumberApisAtom)
    const mainIdentity = identityKeyOfPhoneNumber(main.phoneNumber)
    const extraCursors = get(notesStateAtom).extraIdentitiesNotesNextPageParam

    const mainResult = yield* _(
      fetchNotesOfPhoneNumber({
        ...main,
        cursor: get(notesNextPageParamAtom),
      })
    )
    const extraResults = yield* _(
      Effect.forEach(
        extras,
        (extra) => {
          const identity = identityKeyOfPhoneNumber(extra.phoneNumber)
          return fetchNotesOfPhoneNumber({
            ...extra,
            cursor: extraCursors?.[identity],
          }).pipe(
            Effect.map(({notes, nextCursor}) => ({
              identity,
              nextCursor,
              // Owner parts are encrypted for the main number only
              notes: Array.filter(
                notes,
                ({noteInfo}) => !noteInfo.privatePart.adminId
              ),
            })),
            // One number failing must not hold back the others
            Effect.catchAll((e) => {
              reportError(
                'warn',
                new Error('Error fetching notes of an extra phone number'),
                {e}
              )
              return Effect.succeed({
                identity,
                nextCursor: extraCursors?.[identity],
                notes: [],
              })
            })
          )
        },
        {concurrency: 'unbounded'}
      )
    )

    const removedNoteIds = yield* _(
      Effect.forEach(
        [main, ...extras],
        (one) =>
          getRemovedNoteIdsOfPhoneNumber({...one, storedNotes, mainIdentity}),
        {concurrency: 'unbounded'}
      )
    )

    set(notesStateAtom, (old) => ({
      ...old,
      // Committed together with the notes so a failed refresh cannot skip them.
      notesNextPageParam: mainResult.nextCursor,
      extraIdentitiesNotesNextPageParam: pipe(
        extraResults,
        Array.filterMap(({identity, nextCursor}) =>
          nextCursor === undefined
            ? Option.none()
            : Option.some([identity, nextCursor] satisfies [
                PublicKeyPemBase64,
                string,
              ])
        ),
        Record.fromEntries
      ),
      notes: mergeIncomingNotesToState({
        incomingNotes: [
          ...mainResult.notes,
          ...Array.flatMap(extraResults, (one) => one.notes),
        ],
        storedNotes: old.notes,
        removedNoteIds,
        mainIdentity,
      }),
      lastUpdatedAt: updateStartedAt,
    }))
    set(linkRestoredInboxesToMyOffersAndNotesActionAtom)
  }).pipe(
    Effect.catchAll((e) => {
      reportError('error', new Error('Error refreshing notes'), {e})
      return Effect.void
    })
  )
)

const inFlightRefreshFiberAtom = atom<Fiber.RuntimeFiber<void> | null>(null)

export const refreshNotesActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const inFlightRefresh = get(inFlightRefreshFiberAtom)
    if (inFlightRefresh) return yield* _(Fiber.join(inFlightRefresh))

    const refreshFiber = yield* _(
      set(runRefreshNotesActionAtom).pipe(
        Effect.ensuring(
          Effect.sync(() => {
            set(inFlightRefreshFiberAtom, null)
          })
        ),
        Effect.forkDaemon
      )
    )

    set(inFlightRefreshFiberAtom, refreshFiber)
    return yield* _(Fiber.join(refreshFiber))
  })
)
