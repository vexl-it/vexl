import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {type RootStackScreenProps} from '../../../navigationTypes'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {showGoldenAvatarInfoModalActionAton} from '../../GoldenAvatar/atoms'
import {chatMolecule} from '../atoms'

export default function useOtherSideAvatarPress(): () => void {
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

  const image = otherSideData.image
  const hasGoldenAvatar =
    !!otherSideGoldenAvatarType ||
    (!offer?.ownershipInfo && !!offer?.offerInfo.publicPart.goldenAvatarType)

  if (image.type === 'imageUri')
    return () => {
      navigation.navigate('ChatImagePreview', {
        imageUri: resolveLocalUri(image.imageUri),
      })
    }
  if (hasGoldenAvatar) return showGoldenAvatarInfoModal
  return () => {
    navigation.navigate('ChatImagePreview', {svgXml: image.svgXml})
  }
}
