import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {type RootStackScreenProps} from '../../../navigationTypes'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {showGoldenAvatarInfoModalActionAton} from '../../GoldenAvatar/atoms'
import {chatMolecule} from '../atoms'

/** Returns undefined when the other side's avatar has nothing to open. */
export default function useOtherSideAvatarPress(): (() => void) | undefined {
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {offerForChatAtom, otherSideDataAtom, otherSideGoldenAvatarTypeAtom} =
    useMolecule(chatMolecule)
  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const otherSideGoldenAvatarType = useAtomValue(otherSideGoldenAvatarTypeAtom)
  const showGoldenAvatarInfoModal = useSetAtom(
    showGoldenAvatarInfoModalActionAton
  )

  const imageUri =
    otherSideData.image.type === 'imageUri'
      ? otherSideData.image.imageUri
      : undefined
  const hasGoldenAvatar =
    !!otherSideGoldenAvatarType ||
    (!offer?.ownershipInfo && !!offer?.offerInfo.publicPart.goldenAvatarType)

  if (imageUri)
    return () => {
      navigation.navigate('ChatImagePreview', {
        imageUri: resolveLocalUri(imageUri),
      })
    }
  if (hasGoldenAvatar) return showGoldenAvatarInfoModal
  return undefined
}
