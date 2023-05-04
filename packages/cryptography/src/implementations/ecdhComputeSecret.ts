import crypto from 'node:crypto'

export type EcdhComputeSecretFunction = (args: {
  publicKeyToComputeSecretTo: Buffer
  privateKeyRaw?: Buffer
  curve: string
}) => Promise<{
  publicKey: Buffer
  secret: Buffer
}>

export const defaultImplementation: EcdhComputeSecretFunction = async ({
  publicKeyToComputeSecretTo,
  privateKeyRaw,
  curve,
}) => {
  const ecdh = crypto.createECDH(curve)
  if (privateKeyRaw) {
    ecdh.setPrivateKey(privateKeyRaw)
  } else {
    ecdh.generateKeys()
  }

  return {
    secret: ecdh.computeSecret(publicKeyToComputeSecretTo),
    publicKey: ecdh.getPublicKey(),
  }
}

let implementationToUse = defaultImplementation

export function getECDHComputeSecretFunction(): EcdhComputeSecretFunction {
  return implementationToUse
}

export function setEcdhComputeSecretImplementation(
  implementation?: EcdhComputeSecretFunction
): void {
  implementationToUse = implementation ?? defaultImplementation
}
