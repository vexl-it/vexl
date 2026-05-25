import {atom} from 'jotai'
import {type Region} from 'react-native-maps'

export const mapRegionAtom = atom<Region | null>(null)

const shouldCommitNextCameraMoveMapRegionAtom = atom(false)

export const requestMapRegionCommitAfterCameraMoveActionAtom = atom(
  null,
  (_, set) => {
    set(shouldCommitNextCameraMoveMapRegionAtom, true)
  }
)

export const commitMapRegionAfterCameraMoveActionAtom = atom(
  null,
  (
    get,
    set,
    {
      region,
      shouldCommit,
    }: {
      readonly region: Region
      readonly shouldCommit: boolean
    }
  ): boolean => {
    if (!get(shouldCommitNextCameraMoveMapRegionAtom)) return false

    set(shouldCommitNextCameraMoveMapRegionAtom, false)

    if (!shouldCommit) return false

    set(mapRegionAtom, region)
    return true
  }
)
