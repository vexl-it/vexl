import {
  defaultImplementation,
  setEcdhComputeSecretImplementation,
} from '@vexl-next/cryptography/src/implementations/ecdhComputeSecret'
import {computeSharedSecret} from '@vexl-next/react-native-ecdh-platform-native-utils/src'
import {Platform} from 'react-native'

setEcdhComputeSecretImplementation(
  Platform.OS === 'ios' ? defaultImplementation : computeSharedSecret
)
