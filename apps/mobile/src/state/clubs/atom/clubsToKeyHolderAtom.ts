import {KeyHolder} from '@vexl-next/cryptography'
import {PrivateKeyHolderE} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid, ClubUuidE} from '@vexl-next/domain/src/general/clubs'
import {Schema, Struct} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'

const ClubsToKeyHolder = Schema.Struct({
  data: Schema.Record({key: ClubUuidE, value: KeyHolder.PrivateKeyHolderE}),
  waitingForAdmission: Schema.optionalWith(Schema.Array(PrivateKeyHolderE), {
    default: () => [],
  }),
})

export type ClubsToKeyHolder = typeof ClubsToKeyHolder.Type

export const clubsKeyHolderStorageAtom = atomWithParsedMmkvStorageE(
  'storedClubs',
  {data: {}, waitingForAdmission: []},
  ClubsToKeyHolder
)

export const clubsToKeyHolderAtom = focusAtom(clubsKeyHolderStorageAtom, (o) =>
  o.prop('data')
)

export const keysWaitingForAdmissionAtom = focusAtom(
  clubsKeyHolderStorageAtom,
  (o) => o.prop('waitingForAdmission')
)

export const addKeyToWaitingForAdmissionActionAtom = atom(
  null,
  (_, set, key: PrivateKeyHolderE) => {
    set(keysWaitingForAdmissionAtom, (data) => [...data, key])
  }
)

export const removeClubFromKeyHolderStateActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    set(clubsToKeyHolderAtom, Struct.omit(clubUuid))
  }
)
