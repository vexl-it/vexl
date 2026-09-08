import {parsePhoneNumber} from 'awesome-phonenumber'
import {type StoredContactWithComputedValues} from '../state/contacts/domain'

export function getInternationalPhoneNumber(phoneNumber: string): string {
  return parsePhoneNumber(phoneNumber).number?.international ?? phoneNumber
}

export function formatContactValue({
  info,
  computedValues,
}: Pick<StoredContactWithComputedValues, 'info' | 'computedValues'>): string {
  return info.kind === 'phone'
    ? getInternationalPhoneNumber(computedValues.normalizedValue)
    : computedValues.normalizedValue
}
