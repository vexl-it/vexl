import {generatePrivateKey} from '../KeyHolder'
import {PublicKeyPemBase64} from '../KeyHolder/brands'
import {stripVersion} from '../versionWrapper'
import {ecdsaSign, ecdsaVerify} from './ecdsa'

const privateKey = generatePrivateKey()

it('Should successfully sign message and verify the message is signed', () => {
  const challenge = 'Random String'
  const signature = ecdsaSign({
    challenge,
    privateKey,
  })

  expect(signature).toBeTruthy()

  const verified = ecdsaVerify({
    challenge,
    signature: stripVersion(signature),
    pubKey: privateKey.publicKeyPemBase64,
  })
  expect(verified).toBe(true)
})

it('Should successfully verify message that was signed using openssl command', () => {
  const publicKey = PublicKeyPemBase64.parse(
    'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUVSZGtIN1hHM1VRaGZIR1RzQmJ5alVXRmU2SFNycmxZWQpYcm95b0cvdGszMDlxaEprbGtCcGN0eWV2OUJIQUE0VlVPWi9GSytpNzZFPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0='
  )

  //    char privateKey[] = "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1IZ0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFWVRCZkFnRUJCQndsOUhvMDd0VTZaUW1kSGhRV01OUUUKR1N3Tm9McldmMVVvaFhkY29Ud0RPZ0FFU0RGWnFSRzBRb291TFpsV09KTFBSVlJqYUxLQXJZdldDRG94ZnRyUAppSVdQNGh6RlRNVDlhZHg5R24vcWpsNlNXWlVFVXp0REdEZz0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo=";
  const challenge = 'ftaafxneekyrmnfzwyxmathnbvbxjdjt'
  /*
          generated with:
          openssl dgst -sha256 -sign <(base64 -d -i <(echo $PRIVATE_KEY)) <( echo -n "$CHALLENGE" ) | openssl base64 -A
      */
  const generatedSignature =
    'MD0CHHRSQVISVq0Ji5wsX4rfas/3dOe9NRcxzsz80c0CHQDtbejFi31EjorwY8ReHgprkhSdKVJfHZbzx7NC'
  const verified = ecdsaVerify({
    challenge,
    signature: generatedSignature,
    pubKey: publicKey,
  })

  expect(verified).toEqual(true)
})

it('Should not verify signature signed with different public key', () => {
  const privateKey = generatePrivateKey()
  const privateKey2 = generatePrivateKey()
  const challenge = 'Some message'
  const signature = ecdsaSign({
    challenge,
    privateKey,
  })

  const verified = ecdsaVerify({
    challenge,
    signature: stripVersion(signature),
    pubKey: privateKey2.publicKeyPemBase64,
  })
  expect(verified).toEqual(false)
})
