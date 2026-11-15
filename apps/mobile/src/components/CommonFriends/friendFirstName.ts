import {type StoredContactWithComputedValues} from '../../state/contacts/domain'

export function friendFirstName(
  friend: StoredContactWithComputedValues
): string {
  return friend.info.name.trim().split(/\s+/)[0] || friend.info.name
}
