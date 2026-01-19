import {
  defaultImplementation,
  setEcdhComputeSecretImplementation,
} from '@vexl-next/cryptography/src/implementations/ecdhComputeSecret'

setEcdhComputeSecretImplementation(defaultImplementation)
