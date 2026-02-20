import {
  KeyPairV2,
  PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Schema, Struct} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

const ClubKeys = Schema.Struct({
  keyPair: KeyPairV2,
  oldKeyPair: PrivateKeyHolder,
})
export type ClubKeys = typeof ClubKeys.Type

const ClubsToKeyHolderV2 = Schema.Struct({
  data: Schema.Record({key: ClubUuid, value: ClubKeys}),
  waitingForAdmission: Schema.optionalWith(Schema.Array(ClubKeys), {
    default: () => [],
  }),
})

export type ClubsToKeyHolderV2 = typeof ClubsToKeyHolderV2.Type

export const clubsKeyHolderStorageAtom = atomWithParsedMmkvStorage(
  'storedClubsV2',
  {data: {}, waitingForAdmission: []},
  ClubsToKeyHolderV2
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
  (_, set, key: ClubKeys) => {
    set(keysWaitingForAdmissionAtom, (data) => [...data, key])
  }
)

export const removeClubFromKeyHolderStateActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    set(clubsToKeyHolderAtom, Struct.omit(clubUuid))
  }
)
