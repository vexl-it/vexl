import {
  defaultImplementation,
  setEcdhComputeSecretImplementation,
} from '@vexl-next/cryptography/src/implementations/ecdhComputeSecret'
import {Platform} from 'react-native'
import {computeSharedSecret} from '@vexl-next/react-native-ecdh-platform-native-utils/src'

setEcdhComputeSecretImplementation(
  Platform.OS === 'ios' ? defaultImplementation : computeSharedSecret
)
