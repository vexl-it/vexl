import {KeyHolder} from '@vexl-next/cryptography'
import {PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Schema, Struct} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

const ClubsToKeyHolder = Schema.Struct({
  data: Schema.Record({key: ClubUuid, value: KeyHolder.PrivateKeyHolder}),
  waitingForAdmission: Schema.optionalWith(Schema.Array(PrivateKeyHolder), {
    default: () => [],
  }),
})

export type ClubsToKeyHolder = typeof ClubsToKeyHolder.Type

export const clubsKeyHolderStorageAtom = atomWithParsedMmkvStorage(
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
  (_, set, key: PrivateKeyHolder) => {
    set(keysWaitingForAdmissionAtom, (data) => [...data, key])
  }
)

export const removeClubFromKeyHolderStateActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    set(clubsToKeyHolderAtom, Struct.omit(clubUuid))
  }
)
