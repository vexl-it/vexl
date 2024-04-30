import {PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder/index'
import {FcmCypher} from '@vexl-next/domain/src/general/notifications'
import {atom} from 'jotai'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'

const fcmCypherToKeyHolderAtom = atomWithParsedMmkvStorage(
  'fcmCypherToKeyHolder',
  {data: {}},
  z.object({data: z.record(FcmCypher, PrivateKeyHolder)})
)

export const registerFcmCypherActionAtom = atom(
  null,
  (
    get,
    set,
    {fcmCypher, keyHolder}: {fcmCypher: FcmCypher; keyHolder: PrivateKeyHolder}
  ): void => {
    set(fcmCypherToKeyHolderAtom, (prev) => ({...prev, [fcmCypher]: keyHolder}))
  }
)

export const getKeyHolderForFcmCypherActionAtom = atom(
  null,
  (get, set, fcmCypher: FcmCypher): PrivateKeyHolder | undefined => {
    return get(fcmCypherToKeyHolderAtom).data[fcmCypher]
  }
)
