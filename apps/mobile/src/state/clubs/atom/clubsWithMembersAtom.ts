import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Array, type Option, Schema} from 'effect'
import {type Atom, atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {ClubWithMembers} from '../domain'

export class UserClubKeypairMissingError extends Schema.TaggedError<UserClubKeypairMissingError>(
  'UserClubKeypairMissingError'
)('UserClubKeypairMissingError', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  message: Schema.String,
}) {}

export const clubsWithMembersStorageAtom = atomWithParsedMmkvStorageE(
  'clubsWithMembers',
  {data: []},
  Schema.Struct({data: Schema.Array(ClubWithMembers).pipe(Schema.mutable)})
)

export const clubsWithMembersAtom = atom(
  (get) => get(clubsWithMembersStorageAtom).data
)

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
