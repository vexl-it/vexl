import {KeyHolder} from '@vexl-next/cryptography'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Schema} from 'effect'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'

const ClubsDataStored = Schema.Struct({
  data: Schema.Record({key: ClubUuid, value: KeyHolder.PrivateKeyHolderE}),
})

type ClubsDataStored = typeof ClubsDataStored.Type

export const clubsStoreAtom = atomWithParsedMmkvStorageE(
  'storedClubs',
  {data: {} as Record<ClubUuid, KeyHolder.PrivateKeyHolder>},
  ClubsDataStored
)

export const storedClubsAtom = focusAtom(clubsStoreAtom, (o) => o.prop('data'))
