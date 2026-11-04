import {readContentFile} from './files'

export function getTermsAndPrivacy(): string {
  return readContentFile('terms-privacy.md')
}
