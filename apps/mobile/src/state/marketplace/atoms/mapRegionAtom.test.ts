import {createStore} from 'jotai'
import {type Region} from 'react-native-maps'
import {
  commitMapRegionAfterCameraMoveActionAtom,
  mapRegionAtom,
  requestMapRegionCommitAfterCameraMoveActionAtom,
} from './mapRegionAtom'

function makeRegion(latitudeDelta: number): Region {
  return {
    latitude: 50,
    longitude: 14,
    latitudeDelta,
    longitudeDelta: 2,
  }
}

describe('mapRegionAtom camera move commits', () => {
  test('ignores camera move region changes until requested', () => {
    const store = createStore()
    const region = makeRegion(1)

    const didCommit = store.set(commitMapRegionAfterCameraMoveActionAtom, {
      region,
      shouldCommit: true,
    })

    expect(didCommit).toBe(false)
    expect(store.get(mapRegionAtom)).toBeNull()
  })

  test('commits one requested camera move region change', () => {
    const store = createStore()
    const region = makeRegion(1)
    const nextRegion = makeRegion(3)

    store.set(requestMapRegionCommitAfterCameraMoveActionAtom)

    expect(
      store.set(commitMapRegionAfterCameraMoveActionAtom, {
        region,
        shouldCommit: true,
      })
    ).toBe(true)
    expect(store.get(mapRegionAtom)).toEqual(region)

    expect(
      store.set(commitMapRegionAfterCameraMoveActionAtom, {
        region: nextRegion,
        shouldCommit: true,
      })
    ).toBe(false)
    expect(store.get(mapRegionAtom)).toEqual(region)
  })

  test('consumes requested camera move region changes without committing when guarded', () => {
    const store = createStore()
    const region = makeRegion(1)
    const nextRegion = makeRegion(3)

    store.set(requestMapRegionCommitAfterCameraMoveActionAtom)

    expect(
      store.set(commitMapRegionAfterCameraMoveActionAtom, {
        region,
        shouldCommit: false,
      })
    ).toBe(false)
    expect(store.get(mapRegionAtom)).toBeNull()

    expect(
      store.set(commitMapRegionAfterCameraMoveActionAtom, {
        region: nextRegion,
        shouldCommit: true,
      })
    ).toBe(false)
    expect(store.get(mapRegionAtom)).toBeNull()
  })
})
