import {KeyHolder} from '@vexl-next/cryptography'
import {PrivateKeyHolderE} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuidE} from '@vexl-next/domain/src/general/clubs'
import {Schema} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'

const ClubsDataStored = Schema.Struct({
  data: Schema.Record({key: ClubUuidE, value: KeyHolder.PrivateKeyHolderE}),
  waitingForAdmission: Schema.optionalWith(Schema.Array(PrivateKeyHolderE), {
    default: () => [],
  }),
})

type ClubsDataStored = typeof ClubsDataStored.Type

export const myClubsStorageAtom = atomWithParsedMmkvStorageE(
  'storedClubs',
  {data: {}, waitingForAdmission: []},
  ClubsDataStored
)

export const myStoredClubsAtom = focusAtom(myClubsStorageAtom, (o) =>
  o.prop('data')
)

export const keysWaitingForAdmissionAtom = focusAtom(myClubsStorageAtom, (o) =>
  o.prop('waitingForAdmission')
)

export const addKeyToWaitingForAdmissionActionAtom = atom(
  null,
  (_, set, key: PrivateKeyHolderE) => {
    set(keysWaitingForAdmissionAtom, (data) => [...data, key])
  }
)
