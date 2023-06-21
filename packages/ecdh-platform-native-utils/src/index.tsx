import {NativeModules, Platform} from 'react-native'

const LINKING_ERROR = `The package 'react-native-ecdh-platform-native-utils' doesn't seem to be linked. Make sure:
  Platform.select({ios: "- You have run 'pod install'\n", default: ''})
  - You rebuilt the app after installing the package\n'
  - You are not using Expo Go\n`

const EcdhPlatformNativeUtils = NativeModules.EcdhPlatformNativeUtils
  ? NativeModules.EcdhPlatformNativeUtils
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR)
        },
      }
    )

export async function computeSharedSecret({
  publicKeyToComputeSecretTo,
  privateKeyRaw,
  curve,
}: {
  publicKeyToComputeSecretTo: Buffer
  privateKeyRaw?: Buffer
  curve: string
}): Promise<{publicKey: Buffer; secret: Buffer}> {
  if (Platform.OS === 'ios') {
    throw new Error('Ecdh compute secret is not supported on iOS yet')
  }

  const result = await EcdhPlatformNativeUtils.computeSharedSecret(
    publicKeyToComputeSecretTo.toString('base64'),
    privateKeyRaw?.toString('base64') ?? null,
    curve
  )

  return {
    publicKey: Buffer.from(result.publicKey, 'base64'),
    secret: Buffer.from(result.sharedSecret, 'base64'),
  }
}
