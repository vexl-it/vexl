import {type PublicKeyV2} from '@vexl-next/cryptography'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Array, Effect, Option} from 'effect'
import {appVersionSupportingV2KeysConfig} from '../configs'

export const toCompatiblePublicKeyArray =
  (forVersionO: Option.Option<VersionCode>) =>
  (
    keys: ReadonlyArray<{
      publicKey: PublicKeyPemBase64
      publicKeyV2?: PublicKeyV2 | null | undefined | Option.Option<PublicKeyV2>
    }>
  ) =>
    Effect.gen(function* () {
      const minimalVersionSupportingV2Keys =
        yield* appVersionSupportingV2KeysConfig

      const forVersion = Option.getOrElse(forVersionO, () => 0)

      return Array.map(keys, ({publicKey, publicKeyV2}) => {
        const publicKeyV2Option = Option.isOption(publicKeyV2)
          ? publicKeyV2
          : Option.fromNullishOr(publicKeyV2)
        if (forVersion >= minimalVersionSupportingV2Keys) {
          return Option.getOrElse(publicKeyV2Option, () => publicKey)
        }

        return publicKey
      })
    })
