import {atom} from 'jotai'

export const hashingProgressPercentageAtom = atom<number>(0)

export const hashingInProgressAtom = atom<boolean>((get) => {
  const hashingProgressPercentage = get(hashingProgressPercentageAtom)

  return hashingProgressPercentage !== 0
})
