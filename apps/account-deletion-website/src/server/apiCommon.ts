import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {ENV_PRESETS} from '@vexl-next/rest-api'
import {AppSource} from '@vexl-next/rest-api/src/commonHeaders'
import {Schema} from 'effect'

export function getEnvPreset() {
  return process.env.BE_ENV === 'prod'
    ? ENV_PRESETS.prodEnv
    : ENV_PRESETS.stageEnv
}

export const apiMeta = {
  appSource: Schema.decodeUnknownSync(AppSource)('account-deletion-page'),
  clientSemver: Schema.decodeUnknownSync(SemverString)('0.0.1'),
  clientVersion: Schema.decodeUnknownSync(VersionCode)(0),
  isDeveloper: false,
  language: 'en',
  platform: Schema.decodeUnknownSync(PlatformName)('WEB'),
}

export const userSessionCredentials = {
  hash: Schema.decodeUnknownSync(HashedPhoneNumber)('dummy'),
  publicKey: Schema.decodeUnknownSync(PublicKeyPemBase64)('dummy'),
  signature: Schema.decodeUnknownSync(EcdsaSignature)('dummy'),
}
