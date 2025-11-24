import {
  type ClubLinkInfo,
  type ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type ListClubLinksResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Data, Effect, Option, pipe} from 'effect'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {apiAtom} from '../../api'
import {clubsToKeyHolderAtom} from '../../state/clubs/atom/clubsToKeyHolderAtom'

type ListLinksError = Effect.Effect.Error<
  ReturnType<ContactApi['listClubLinks']>
>

class ClubKeypairMissingError extends Data.TaggedError(
  'ClubKeypairMissingError'
) {}

const fetchedClubLinksAtom = atom<
  | {state: 'done'; data: ListClubLinksResponse}
  | {
      state: 'error'
      error: ListLinksError | ClubKeypairMissingError
    }
  | {state: 'loading'}
>({state: 'loading'})

export const isLoadingAtom = atom(
  (get) => get(fetchedClubLinksAtom).state === 'loading'
)
export const errorAtom = atom((get) => {
  const state = get(fetchedClubLinksAtom)
  if (state.state === 'error') return Option.some(state.error)
  return Option.none()
})

export const fetchClubLinksActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    const {contact} = get(apiAtom)
    const clubUuidKeyPair = get(clubsToKeyHolderAtom)[clubUuid]

    const existingData = get(fetchedClubLinksAtom)
    if (
      existingData.state === 'done' &&
      existingData.data.clubUuid !== clubUuid
    )
      set(fetchedClubLinksAtom, {state: 'loading'})

    return pipe(
      Option.fromNullable(clubUuidKeyPair),
      Effect.catchAll(() => Effect.fail(new ClubKeypairMissingError())),
      Effect.flatMap((keyPair) => contact.listClubLinks({clubUuid, keyPair})),
      Effect.tapBoth({
        onFailure: (error) =>
          Effect.sync(() => {
            set(fetchedClubLinksAtom, {
              state: 'error',
              error,
            })
          }),
        onSuccess: (data) =>
          Effect.sync(() => {
            set(fetchedClubLinksAtom, {
              state: 'done',
              data,
            })
          }),
      })
    )
  }
)

export const regenerateClubLinkActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    const {contact} = get(apiAtom)
    const clubUuidKeyPair = get(clubsToKeyHolderAtom)[clubUuid]
    if (!clubUuidKeyPair) {
      return Effect.fail({
        state: 'error',
        error: {_tag: 'clubKeypairMissingError' as const},
      })
    }

    const fetchLinks = contact
      .listClubLinks({clubUuid, keyPair: clubUuidKeyPair})
      .pipe(Effect.map((d) => d.links))
    const removeExistingLinks = fetchLinks.pipe(
      Effect.flatMap(
        Effect.forEach((link) =>
          contact.deactivateClubJoinLink({
            clubUuid,
            keyPair: clubUuidKeyPair,
            code: link.code,
          })
        )
      )
    )
    const generateNewLink = contact.generateClubJoinLink({
      clubUuid,
      keyPair: clubUuidKeyPair,
    })
    const refreshData = set(fetchClubLinksActionAtom, clubUuid)

    return pipe(
      removeExistingLinks,
      Effect.andThen(() => generateNewLink),
      Effect.andThen(() => refreshData),
      // TODO handle errors
      Effect.ignore
    )
  }
)

export function useClubInviteLink(
  clubUuid: ClubUuid
): Option.Option<ClubLinkInfo> {
  const state = useAtomValue(fetchedClubLinksAtom)
  const fetchLinks = useSetAtom(fetchClubLinksActionAtom)

  useEffect(() => {
    Effect.runFork(fetchLinks(clubUuid))
  }, [fetchLinks, clubUuid])

  return state.state === 'done'
    ? Option.fromNullable(state.data.links[0])
    : Option.none()
}
