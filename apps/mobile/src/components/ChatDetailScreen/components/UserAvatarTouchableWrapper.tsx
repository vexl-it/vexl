import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {useMolecule} from 'bunshi/dist/react'
import {useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {chatMolecule} from '../atoms'

interface Props {
  children: React.ReactNode
  userImageUri: UriString | undefined
}

function UserAvatarTouchableWrapper({
  children,
  userImageUri,
}: Props): JSX.Element {
  const {openedImageUriAtom} = useMolecule(chatMolecule)
  const setOpenedImageUri = useSetAtom(openedImageUriAtom)

  return (
    <TouchableOpacity
      onPress={() => {
        setOpenedImageUri(userImageUri)
      }}
    >
      {children}
    </TouchableOpacity>
  )
}

export default UserAvatarTouchableWrapper
