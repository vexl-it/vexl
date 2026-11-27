import {
  buildContactReachGraph,
  getContactReachCounts,
  getNewPeopleThroughContacts,
  getOrderedContactLosses,
  updatePendingOffOrder,
} from './contactReach'

const graph = buildContactReachGraph(
  [
    ['alice', ['anna', 'petr']],
    ['bob', ['anna']],
    ['carol', ['petr']],
    ['dave', ['anna', 'petr', 'klara']],
  ],
  new Set(['anna', 'petr', 'klara']),
  new Set()
)

describe('contact reach', () => {
  it('counts people and exclusive paths, deduplicating hashes and ignoring non-imported contacts', () => {
    const duplicateGraph = buildContactReachGraph(
      [
        ['alice', ['anna', 'anna', 'unused']],
        ['alice', ['anna']],
        ['bob', ['unused']],
      ],
      new Set(['anna']),
      new Set()
    )
    expect(getContactReachCounts(duplicateGraph).get('anna')).toEqual({
      people: 1,
      exclusive: 1,
    })
    expect(duplicateGraph.contactsByIndirectPerson.has('bob')).toBe(false)
    expect(getContactReachCounts(graph).get('anna')).toEqual({
      people: 3,
      exclusive: 1,
    })
  })

  it('never counts direct contacts as exclusive or lost through shared contacts', () => {
    const withDirect = buildContactReachGraph(
      [
        ['alice', ['anna']],
        ['bob', ['anna']],
      ],
      new Set(['anna']),
      new Set(['bob'])
    )
    expect(getContactReachCounts(withDirect).get('anna')).toEqual({
      people: 2,
      exclusive: 1,
    })
    expect(getOrderedContactLosses(withDirect, ['anna']).total).toBe(1)
  })

  it('attributes an overlapping loss to the last off-switch, and rows sum to the total', () => {
    const losses = getOrderedContactLosses(graph, ['anna', 'petr'])
    expect(losses.total).toBe(3)
    expect([...losses.byContact]).toEqual([
      ['petr', 2],
      ['anna', 1],
    ])
    const reversed = getOrderedContactLosses(graph, ['petr', 'anna'])
    expect(reversed.total).toBe(3)
    expect(reversed.byContact.get('anna')).toBe(2)
    expect(reversed.byContact.get('petr')).toBe(1)
  })

  it('recalculates later losses when a contact is turned back on', () => {
    expect(getOrderedContactLosses(graph, ['petr'])).toEqual({
      byContact: new Map([['petr', 1]]),
      total: 1,
    })
    expect(
      getOrderedContactLosses(graph, ['anna', 'petr', 'klara']).total
    ).toBe(4)
    expect(getOrderedContactLosses(graph, []).total).toBe(0)
  })

  it('ignores pending on contacts until they appear in a synced graph', () => {
    expect(
      getOrderedContactLosses(graph, ['anna', 'petr', 'klara', 'unused']).total
    ).toBe(4)
  })

  it('names only people newly connected through the added contact, irrespective of removals', () => {
    const after = buildContactReachGraph(
      [
        ['alice', ['new']],
        ['eve', ['new']],
        ['frank', ['unrelated']],
      ],
      new Set(['new', 'unrelated']),
      new Set()
    )
    expect(
      getNewPeopleThroughContacts(
        new Set(graph.contactsByIndirectPerson.keys()),
        after,
        ['new']
      )
    ).toBe(1)
    expect(
      getNewPeopleThroughContacts(
        new Set(graph.contactsByIndirectPerson.keys()),
        after,
        ['missing']
      )
    ).toBe(0)
  })

  it('counts each newly connected person once across several added contacts', () => {
    const after = buildContactReachGraph(
      [
        ['alice', ['new', 'other']],
        ['eve', ['new', 'other']],
        ['frank', ['other']],
      ],
      new Set(['new', 'other']),
      new Set()
    )
    expect(
      getNewPeopleThroughContacts(
        new Set(graph.contactsByIndirectPerson.keys()),
        after,
        ['new', 'other']
      )
    ).toBe(2)
  })

  it('handles empty graphs and contacts with no shared people', () => {
    const empty = buildContactReachGraph([], new Set(['anna']), new Set())
    expect(getContactReachCounts(empty).size).toBe(0)
    expect(getOrderedContactLosses(empty, ['anna']).total).toBe(0)
  })

  it('keeps flip order, applies bulk changes in list order, and moves re-enabled switches to the end', () => {
    const all = new Set(['anna', 'petr', 'klara'])
    const oneOff = new Set(['anna', 'klara'])
    const order = updatePendingOffOrder([], all, oneOff, [
      'anna',
      'petr',
      'klara',
    ])
    expect(order).toEqual(['petr'])
    expect(
      updatePendingOffOrder(order, oneOff, new Set(), ['klara', 'anna', 'petr'])
    ).toEqual(['petr', 'klara', 'anna'])
    const reset = updatePendingOffOrder(
      ['petr', 'anna'],
      new Set(['klara']),
      new Set(['petr', 'klara']),
      ['anna', 'petr', 'klara']
    )
    expect(reset).toEqual(['anna'])
    expect(
      updatePendingOffOrder(
        reset,
        new Set(['petr', 'klara']),
        new Set(['klara']),
        ['anna', 'petr', 'klara']
      )
    ).toEqual(['anna', 'petr'])
  })

  it('scales to a large overlapping network without counting paths as people', () => {
    const edges: Array<readonly [string, string[]]> = []
    for (let i = 0; i < 10000; i++)
      edges.push([`person-${i}`, ['anna', 'petr']])
    const large = buildContactReachGraph(
      edges,
      new Set(['anna', 'petr']),
      new Set()
    )
    expect(
      getOrderedContactLosses(large, ['anna', 'petr']).byContact.get('petr')
    ).toBe(10000)
    expect(getOrderedContactLosses(large, ['anna']).total).toBe(0)
  })
})
