import {TouchableOpacity} from 'react-native'
import {useSetAtom} from 'jotai'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import {useMolecule} from 'jotai-molecules'
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
