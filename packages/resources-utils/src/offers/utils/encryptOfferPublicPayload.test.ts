import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  OfferPublicPart,
  SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {Effect, Schema} from 'effect'
import {aesGCMIgnoreTagDecrypt} from '../../utils/crypto'
import encryptOfferPublicPayload from './encryptOfferPublicPayload'

const symmetricKey = Schema.decodeSync(SymmetricKey)('symmetric-key')
const vexlNotificationToken = Schema.decodeSync(VexlNotificationToken)(
  'vexl_nt_token'
)

const publicPart = Schema.decodeUnknownSync(OfferPublicPart)({
  offerPublicKey: generatePrivateKey().publicKeyPemBase64,
  location: [],
  offerDescription: 'offer',
  amountBottomLimit: 0,
  amountTopLimit: 100,
  feeState: 'WITHOUT_FEE',
  feeAmount: 0,
  locationState: ['ONLINE'],
  paymentMethod: ['BANK'],
  btcNetwork: ['LIGHTING'],
  currency: 'CZK',
  spokenLanguages: ['ENG'],
  offerType: 'SELL',
  activePriceState: 'NONE',
  activePriceValue: 0,
  activePriceCurrency: 'CZK',
  active: true,
  groupUuids: [],
})

const encryptAndDecrypt = async (
  offerPublicPart: OfferPublicPart
): Promise<unknown> =>
  await Effect.runPromise(
    encryptOfferPublicPayload({offerPublicPart, symmetricKey}).pipe(
      Effect.flatMap((encrypted) =>
        aesGCMIgnoreTagDecrypt(symmetricKey)(encrypted.substring(1))
      ),
      Effect.map((json) => JSON.parse(json))
    )
  )

it('writes the vexl notification token to fcmCypher', async () => {
  expect(
    await encryptAndDecrypt({...publicPart, vexlNotificationToken})
  ).toMatchObject({vexlNotificationToken, fcmCypher: vexlNotificationToken})
})

it('omits fcmCypher when there is no vexl notification token', async () => {
  expect(await encryptAndDecrypt(publicPart)).not.toHaveProperty('fcmCypher')
})
