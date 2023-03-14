import Button from '../../Button'
import {usePrivateApiAssumeLoggedIn} from '../../../api'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import {useSessionAssumeLoggedIn} from '../../../state/session'
import {type PrivateKey} from '@vexl-next/cryptography'
import {
  aesGCMIgnoreTagDecrypt,
  type CryptoError,
  eciesDecrypt,
  type JsonParseError,
  parseJson,
} from '../../../utils/fpUtils'
import {type ServerOffer} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {useState} from 'react'
import Text from '../../Text'

function decryptOffer(
  privateKey: PrivateKey
): (
  flow: ServerOffer
) => TE.TaskEither<
  CryptoError | JsonParseError,
  {serverOffer: ServerOffer; privatePayload: any; publicPayload: any}
> {
  return (serverOffer: ServerOffer) =>
    pipe(
      TE.right(serverOffer),
      TE.bindTo('serverOffer'),
      TE.bindW('privatePayload', ({serverOffer}) => {
        return pipe(
          eciesDecrypt({
            data: serverOffer.privatePayload,
            privateKey,
          }),
          TE.chainEitherKW(parseJson)
        )
      }),
      TE.bindW('publicPayload', ({privatePayload, serverOffer}) => {
        return pipe(
          aesGCMIgnoreTagDecrypt(
            serverOffer.publicPayload.substring(1),
            privatePayload.symmetricKey
          ),
          TE.chainEitherKW(parseJson)
        )
      })
    )
}

export default function DebugFetchOffers(): JSX.Element {
  const {offer} = usePrivateApiAssumeLoggedIn()
  const session = useSessionAssumeLoggedIn()

  const [offers, setOffers] = useState<any[]>([])

  function fetchOffers(): void {
    void pipe(
      offer.getOffersForMe(),
      TE.map((r) => {
        console.log('Number of offers', r.offers.length)
        return r.offers
      }),
      TE.chainW(
        A.traverse(TE.taskEither)(
          decryptOffer(session.sessionCredentials.privateKey)
        )
      ),
      TE.match(
        (l) => {
          console.error(l)
        },
        (offers) => {
          console.log(JSON.stringify(offers))
          setOffers(offers)
        }
      )
    )()
  }

  return (
    <>
      {offers.map((one) => {
        const {publicPayload, privatePayload, ...serverOffer} = one.serverOffer
        return (
          <Text key={JSON.stringify(one)}>
            {JSON.stringify(
              {
                privatePayload: one.privatePayload,
                publicPayload: one.publicPayload,
                zserverOffer: serverOffer,
              },
              null,
              1
            )}
          </Text>
        )
      })}
      <Button
        variant={'secondary'}
        text={'Fetch offers'}
        onPress={fetchOffers}
      />
    </>
  )
}
