import type * as E from 'fp-ts/Either'

export interface NoVersionInProvidedString {
  _type: 'NoVersionInProvidedString'
}

export interface InvalidVersion {
  type: 'InvalidVersion'
}

function getFormattedVersionNumber(version: number): string {
  let versionNumberString = (version - 1).toString(10)
  while (versionNumberString.length < 3) {
    versionNumberString = `0${versionNumberString}`
  }
  return versionNumberString
}

export function appendVersion(string: string, version: number): string {
  return `${getFormattedVersionNumber(version)}.${string}`
}

export function parseStringWithVersion(b64: string): {
  version: number
  data: string
} {
  const [version, ...data] = b64.split('.')
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!version || !data) {
    throw new Error('Provided string does not contain a version')
  }
  const versionNumber = parseInt(version, 10)

  if (isNaN(versionNumber))
    throw new Error('Invalid version in a provided string')
  return {version: versionNumber, data: data.join('.')}
}

export function stripVersion(stringWithVersion: string): string {
  const [version, ...rest] = stringWithVersion.split('.')
  if (rest.length === 0) {
    return version
  }
  return rest.join('.')
}
