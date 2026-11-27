import {Array, pipe} from 'effect'

export interface ContactReachGraph {
  readonly peopleByContact: ReadonlyMap<string, ReadonlySet<string>>
  readonly contactsByIndirectPerson: ReadonlyMap<string, ReadonlySet<string>>
}

// commonFriends never lists a direct contact's own hash, so direct contacts
// stay out of contactsByIndirectPerson instead of looking reachable only
// through the contacts they share with us.
export function buildContactReachGraph(
  commonFriends: Iterable<readonly [string, readonly string[]]>,
  importedHashes: ReadonlySet<string>,
  directPeople: ReadonlySet<string>
): ContactReachGraph {
  const peopleByContact = new Map<string, Set<string>>()
  const contactsByIndirectPerson = new Map<string, Set<string>>()
  for (const [person, hashes] of commonFriends) {
    for (const hash of hashes) {
      if (!importedHashes.has(hash)) continue
      const people = peopleByContact.get(hash) ?? new Set<string>()
      people.add(person)
      peopleByContact.set(hash, people)
      if (directPeople.has(person)) continue
      const contacts = contactsByIndirectPerson.get(person) ?? new Set<string>()
      contacts.add(hash)
      contactsByIndirectPerson.set(person, contacts)
    }
  }
  return {peopleByContact, contactsByIndirectPerson}
}

export function getContactReachCounts(
  graph: ContactReachGraph
): ReadonlyMap<string, {readonly people: number; readonly exclusive: number}> {
  const counts = new Map<string, {people: number; exclusive: number}>()
  for (const [hash, people] of graph.peopleByContact) {
    let exclusive = 0
    for (const person of people) {
      if (graph.contactsByIndirectPerson.get(person)?.size === 1) exclusive++
    }
    counts.set(hash, {people: people.size, exclusive})
  }
  return counts
}

export function getOrderedContactLosses(
  graph: ContactReachGraph,
  offHashes: readonly string[]
): {readonly byContact: ReadonlyMap<string, number>; readonly total: number} {
  const offOrder = new Map<string, number>()
  pipe(
    offHashes,
    Array.forEach((hash, index) => offOrder.set(hash, index))
  )
  const byContact = new Map<string, number>()
  let total = 0
  for (const contacts of graph.contactsByIndirectPerson.values()) {
    let lastHash: string | undefined
    let lastIndex = -1
    let stillConnected = false
    for (const hash of contacts) {
      const index = offOrder.get(hash)
      if (index === undefined) {
        stillConnected = true
        break
      }
      if (index > lastIndex) {
        lastHash = hash
        lastIndex = index
      }
    }
    if (stillConnected || lastHash === undefined) continue
    byContact.set(lastHash, (byContact.get(lastHash) ?? 0) + 1)
    total++
  }
  return {byContact, total}
}

export function getNewPeopleThroughContacts(
  previouslyReached: ReadonlySet<string>,
  after: ContactReachGraph,
  hashes: readonly string[]
): number {
  const newPeople = new Set<string>()
  for (const hash of hashes) {
    for (const person of after.peopleByContact.get(hash) ?? []) {
      if (
        after.contactsByIndirectPerson.has(person) &&
        !previouslyReached.has(person)
      )
        newPeople.add(person)
    }
  }
  return newPeople.size
}

export function updatePendingOffOrder<T>(
  previousOrder: readonly T[],
  previousSelection: ReadonlySet<T>,
  nextSelection: ReadonlySet<T>,
  contactsInOrder: readonly T[]
): T[] {
  const order = Array.filter(
    previousOrder,
    (number) => !nextSelection.has(number)
  )
  const alreadyOff = new Set(order)
  for (const number of contactsInOrder) {
    if (
      previousSelection.has(number) &&
      !nextSelection.has(number) &&
      !alreadyOff.has(number)
    ) {
      order.push(number)
      alreadyOff.add(number)
    }
  }
  return order
}
