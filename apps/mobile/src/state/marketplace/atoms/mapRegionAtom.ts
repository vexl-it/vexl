import {atom} from 'jotai'
import {type Region} from 'react-native-maps'

export const mapRegionAtom = atom<Region | null>(null)

export const isMapRegionSetAtom = atom((get) => {
  return get(mapRegionAtom) !== null
})
