import {KeyHolder} from '@vexl-next/cryptography'
import {ClubUuidE, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Schema} from 'effect'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'

const ClubsDataStored = Schema.Struct({
  data: Schema.Record({key: ClubUuidE, value: KeyHolder.PrivateKeyHolderE}),
})

type ClubsDataStored = typeof ClubsDataStored.Type

const myClubsStorageAtom = atomWithParsedMmkvStorageE(
  'storedClubs',
  {data: {} as Record<ClubUuid, KeyHolder.PrivateKeyHolder>},
  ClubsDataStored
)

export const myStoredClubsAtom = focusAtom(myClubsStorageAtom, (o) =>
  o.prop('data')
)
