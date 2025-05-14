import {type ClubInfo, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {Array, HashSet, Option, pipe, Schema} from 'effect'
import {type Atom, atom, useAtomValue} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {myOffersAtom} from '../../marketplace/atoms/myOffers'
import {ClubWithMembers} from '../domain'

const ClubsLoadingState = Schema.Union(
  Schema.Struct({
    state: Schema.Literal('initial', 'loading', 'success'),
  }),
  Schema.Struct({
    state: Schema.Literal('error'),
    // can be used to hold error state in future
    error: Schema.Unknown,
  })
)

type ClubsLoadingState = typeof ClubsLoadingState.Type

export class UserClubKeypairMissingError extends Schema.TaggedError<UserClubKeypairMissingError>(
  'UserClubKeypairMissingError'
)('UserClubKeypairMissingError', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  message: Schema.String,
}) {}

export const clubsWithMembersStorageAtom = atomWithParsedMmkvStorageE(
  'clubsWithMembers',
  {data: []},
  Schema.Struct({
    data: Schema.Array(ClubWithMembers).pipe(Schema.mutable),
  })
)

export const clubsWithMembersAtom = atom(
  (get) => get(clubsWithMembersStorageAtom).data
)

export const clubsWithMembersLoadingStateAtom = atom<ClubsLoadingState>({
  state: 'initial',
})

export const clubsWithMembersAtomsAtom = splitAtom(
  focusAtom(clubsWithMembersStorageAtom, (optic) => optic.prop('data'))
)

export const singleClubAtom = (
  clubUuid: ClubUuid
): Atom<Option.Option<ClubWithMembers>> =>
  atom((get) =>
    Array.findFirst(
      get(clubsWithMembersAtom),
      (club) => club.club.uuid === clubUuid
    )
  )

export const upsertClubWithMembersActionAtom = atom(
  null,
  (get, set, clubWithMembers: ClubWithMembers) => {
    set(clubsWithMembersStorageAtom, (prev) => ({
      ...prev,
      data: [
        ...Array.filter(
          prev.data,
          (c) => c.club.uuid !== clubWithMembers.club.uuid
        ),
        clubWithMembers,
      ],
    }))
  }
)

export const removeClubWithMembersFromStateActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    set(clubsWithMembersStorageAtom, (prev) => ({
      ...prev,
      data: [...Array.filter(prev.data, (c) => c.club.uuid !== clubUuid)],
    }))
  }
)

export const updateOffersIdsForClubStatActionAtom = atom(
  null,
  (get, set, {newOffers}: {newOffers: readonly OfferInfo[]}) => {
    const myOffersIds = get(myOffersAtom).map(
      (offer) => offer.offerInfo.offerId
    )
    const storedClubsUuids = Array.map(
      get(clubsWithMembersAtom),
      (c) => c.club.uuid
    )

    Array.forEach(storedClubsUuids, (clubUuid) => {
      const clubToUpdate = Array.findFirst(
        get(clubsWithMembersAtom),
        (c) => c.club.uuid === clubUuid
      )
      const newOffersIds = Array.filter(
        newOffers,
        (offer) =>
          offer.privatePart.clubIds?.includes(clubUuid) &&
          !Array.contains(offer.offerId)(myOffersIds)
      ).map((offer) => offer.offerId)

      if (Option.isSome(clubToUpdate)) {
        set(clubsWithMembersStorageAtom, (prev) => ({
          ...prev,
          data: [
            ...Array.filter(prev.data, (c) => c.club.uuid !== clubUuid),
            {
              ...clubToUpdate.value,
              stats: {
                ...clubToUpdate.value.stats,
                allOffersIdsForClub: HashSet.union(
                  HashSet.fromIterable(newOffersIds),
                  clubToUpdate.value.stats.allOffersIdsForClub
                ),
              },
            },
          ],
        }))
      }
    })
  }
)

export const updateChatsPeakCountStatActionAtom = atom(
  null,
  (get, set, {chat}: {chat: Chat}) => {
    const clubsIdsFromChat = chat.otherSide.clubsIds

    Array.forEach(get(clubsWithMembersAtom), (c) => {
      if (Array.contains(clubsIdsFromChat)) {
        set(clubsWithMembersStorageAtom, (prev) => ({
          ...prev,
          data: [
            ...Array.filter(
              prev.data,
              (club) => club.club.uuid !== c.club.uuid
            ),
            {
              ...c,
              stats: {
                ...c.stats,
                allChatsIdsForClub: HashSet.add(chat.id)(
                  c.stats.allChatsIdsForClub
                ),
              },
            },
          ],
        }))
      }
    })
  }
)

export function useGetAllClubsNamesForIds(
  clubsIds: readonly ClubUuid[]
): string[] {
  const clubsWithMembers = useAtomValue(clubsWithMembersAtom)
  return pipe(
    clubsWithMembers,
    Array.filter((club) => Array.contains(club.club.uuid)(clubsIds)),
    Array.map((club) => club.club.name)
  )
}

export function useGetAllClubsForIds(
  clubsIds: readonly ClubUuid[]
): ClubInfo[] {
  const clubsWithMembers = useAtomValue(clubsWithMembersAtom)
  return pipe(
    clubsWithMembers,
    Array.filter((club) => Array.contains(club.club.uuid)(clubsIds)),
    Array.map((club) => club.club)
  )
}
