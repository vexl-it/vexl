import {z} from 'zod'
import {OfferInfo} from '@vexl-next/domain/dist/general/offers'
import {OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {parseJson, safeParse, stringifyToJson} from '../utils/parsing'
import {readFile, saveFile} from '../utils/fs'
import {PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {UserCredentials} from '../utils/auth'
import {ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'

export const CreatedOffer = z.object({
  adminId: OfferAdminId,
  keypair: PrivateKeyHolder,
  symmetricKey: z.string(),
  ownerCredentials: UserCredentials,
  connectionLevel: ConnectionLevel,
  offerInfo: OfferInfo,
})
export type CreatedOffer = z.TypeOf<typeof CreatedOffer>

export function saveCreatedOfferToFile(file: PathString) {
  return (offer: CreatedOffer) =>
    pipe(stringifyToJson(offer), E.chainW(saveFile(file)))
}

export function readCreatedOfferFromFile(file: PathString) {
  return pipe(
    readFile(file),
    E.chainW(parseJson),
    E.chainW(safeParse(CreatedOffer)),
    E.mapLeft((e) => {
      console.error('Error reading created offer from file: ', e)
      return new Error('Error reading created offer from file')
    })
  )
}
