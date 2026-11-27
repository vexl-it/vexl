import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, HashMap, Option, pipe} from 'effect'
import {atom, type Atom} from 'jotai'
import {atomFamily} from 'jotai/utils'
import connectionStateAtom, {
  fistAndSecondLevelConnectionsReachAtom,
} from '../../../../state/connections/atom/connectionStateAtom'
import {normalizedContactsAtom} from '../../../../state/contacts/atom/contactsStore'
import {
  buildContactReachGraph,
  getContactReachCounts,
  getOrderedContactLosses,
} from './contactReach'

export type ContactReachState =
  | {readonly type: 'unused' | 'pendingOn' | 'notSynced'}
  | {
      readonly type: 'active'
      readonly people: number
      readonly exclusive: number
    }
  | {readonly type: 'pendingOff'; readonly loss: number}

export function createContactReachAtoms({
  selectedNumbersAtom,
  pendingOffOrderAtom,
}: {
  readonly selectedNumbersAtom: Atom<ReadonlySet<E164PhoneNumber>>
  readonly pendingOffOrderAtom: Atom<readonly E164PhoneNumber[]>
}): {
  readonly contactReachAtom: (
    number: E164PhoneNumber
  ) => Atom<ContactReachState>
  readonly contactLossTotalAtom: Atom<number>
  readonly contactUsageAtom: Atom<{used: number; total: number}>
} {
  const importedByNumberAtom = atom(
    (get) =>
      new Map(
        pipe(
          get(normalizedContactsAtom),
          Array.filter((contact) => contact.flags.imported),
          Array.map(
            (contact): readonly [E164PhoneNumber, HashedPhoneNumber] => [
              contact.computedValues.normalizedNumber,
              contact.computedValues.hash,
            ]
          )
        )
      )
  )
  const graphAtom = atom((get) => {
    const {commonFriends, firstLevel} = get(connectionStateAtom)
    return buildContactReachGraph(
      HashMap.entries(commonFriends),
      new Set(get(importedByNumberAtom).values()),
      new Set(firstLevel)
    )
  })
  const countsAtom = atom((get) => getContactReachCounts(get(graphAtom)))
  const lossAtom = atom((get) => {
    const imported = get(importedByNumberAtom)
    const selected = get(selectedNumbersAtom)
    const synced = get(connectionStateAtom).syncedContactHashes
    const offHashes = pipe(
      get(pendingOffOrderAtom),
      Array.filterMap((number) => {
        const hash = imported.get(number)
        return hash !== undefined &&
          !selected.has(number) &&
          synced?.has(hash) === true
          ? Option.some(hash)
          : Option.none()
      })
    )
    return getOrderedContactLosses(get(graphAtom), offHashes)
  })
  const contactReachAtom = atomFamily((number: E164PhoneNumber) => {
    const selectedAtom = atom((get) => get(selectedNumbersAtom).has(number))
    return atom((get): ContactReachState => {
      const hash = get(importedByNumberAtom).get(number)
      const selected = get(selectedAtom)
      if (hash === undefined) return {type: selected ? 'pendingOn' : 'unused'}
      if (!get(connectionStateAtom).syncedContactHashes?.has(hash))
        return {type: 'notSynced'}
      if (!selected)
        return {
          type: 'pendingOff',
          loss: get(lossAtom).byContact.get(hash) ?? 0,
        }
      return {
        type: 'active',
        ...(get(countsAtom).get(hash) ?? {people: 0, exclusive: 0}),
      }
    })
  })
  // Direct contacts can't be matched to the Vexl users they are, so they only
  // count once switching everything off makes the whole reach go away.
  const contactLossTotalAtom = atom((get) => {
    const selected = get(selectedNumbersAtom)
    const imported = Array.fromIterable(get(importedByNumberAtom).keys())
    return Array.isNonEmptyReadonlyArray(imported) &&
      Array.every(imported, (number) => !selected.has(number))
      ? get(fistAndSecondLevelConnectionsReachAtom)
      : get(lossAtom).total
  })
  const contactUsageAtom = atom((get) => {
    const contacts = get(normalizedContactsAtom)
    const selected = get(selectedNumbersAtom)
    return {
      total: contacts.length,
      used: Array.filter(contacts, (contact) =>
        selected.has(contact.computedValues.normalizedNumber)
      ).length,
    }
  })
  return {contactReachAtom, contactLossTotalAtom, contactUsageAtom}
}
