import {
  HEADER_HASH,
  HEADER_PUBLIC_KEY,
  HEADER_SIGNATURE,
  SecurityData,
} from './commonTypes'

let currentCredentials: SecurityData | null = null

export function setCredentials(newCredentials: SecurityData) {
  currentCredentials = newCredentials
}

export function getCredentialsHeaders() {
  if (!currentCredentials) {
    throw new Error('Credentials not set')
  }
  return {
    [HEADER_PUBLIC_KEY]: currentCredentials?.privateKey.exportPublicKey(),
    [HEADER_HASH]: currentCredentials?.hash,
    [HEADER_SIGNATURE]: currentCredentials?.signature,
  }
}

export function getCredentials(): SecurityData {
  if (!currentCredentials) {
    throw new Error('Credentials not set')
  }
  return currentCredentials
}
