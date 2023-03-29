import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {getPrivateApi, getPublicApi} from '../api'
import * as crypto from '@vexl-next/cryptography'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'optics-ts'
import {
  type InitPhoneNumberVerificationResponse,
  type VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/dist/services/user/contracts'
import rl from '../utils/rl'
import {UserCredentials} from '../utils/auth'
import {ecdsaSign} from '@vexl-next/resources-utils/dist/utils/crypto'
import {
  safeParse,
  stringifyToPrettyJson,
} from '@vexl-next/resources-utils/dist/utils/parsing'

const verificationIdOptic =
  O.optic<InitPhoneNumberVerificationResponse>().prop('verificationId')
const challengeOptic = O.optic<VerifyPhoneNumberResponse>().prop('challenge')

function login({
  phoneNumber,
}: {
  phoneNumber: E164PhoneNumber
}): TE.TaskEither<unknown, string> {
  const {user} = getPublicApi()
  const keypair = crypto.KeyHolder.generatePrivateKey()

  return pipe(
    TE.right({phoneNumber}),
    TE.chainW(user.initPhoneVerification),
    TE.map(O.get(verificationIdOptic)),
    TE.bindTo('id'),
    TE.bindW('code', () =>
      rl(`Enter verification code sent to ${phoneNumber}: `)
    ),
    TE.chainW(({id, code}) =>
      user.verifyPhoneNumber({
        id,
        code,
        userPublicKey: keypair.publicKeyPemBase64,
      })
    ),
    TE.map(O.get(challengeOptic)),
    TE.chainEitherKW(ecdsaSign(keypair)),
    TE.map((signature) => ({
      userPublicKey: keypair.publicKeyPemBase64,
      signature,
    })),
    TE.chainW(user.verifyChallenge),
    TE.map(({signature, hash}) => ({
      signature,
      hash,
      keypair,
    })),
    TE.chainEitherKW(safeParse(UserCredentials)),
    TE.chainFirstW((credentials) =>
      getPrivateApi(credentials).contact.createUser({firebaseToken: null})
    ),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}

export default login
