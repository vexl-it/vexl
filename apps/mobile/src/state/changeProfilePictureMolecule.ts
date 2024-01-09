import {molecule} from 'jotai-molecules'
import {atom} from 'jotai'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'

export const changeProfilePictureMolecule = molecule(() => {
  console.log(`Render`)
  const selectedImageUriAtom = atom<UriString | undefined>(undefined)

  return {
    selectedImageUriAtom,
  }
})
