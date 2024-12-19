import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {Stack, YStack} from 'tamagui'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import ContactTypeAndCommonNumber from '../../ContactTypeAndCommonNumber'
import {showGoldenAvatarInfoModalActionAton} from '../../GoldenAvatar/atoms'
import UserAvatar from '../../UserAvatar'
import UserNameWithSellingBuying from '../../UserNameWithSellingBuying'
import {chatMolecule} from '../atoms'

interface Props {
  mode: 'photoTop' | 'photoLeft'
}

export const PHOTO_AND_INFO_PHOTO_TOP_HEIGHT = 81 + 16

function OtherSideNamePhotoAndInfo({mode}: Props): JSX.Element {
  const {
    offerForChatAtom,
    openedImageUriAtom,
    otherSideDataAtom,
    otherSideLeftAtom,
    canSendMessagesAtom,
    commonConnectionsCountAtom,
    commonConnectionsHashesAtom,
    friendLevelInfoAtom,
    otherSideGoldenAvatarTypeAtom,
  } = useMolecule(chatMolecule)

  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const otherSideLeft = useAtomValue(otherSideLeftAtom)
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const commonConnectionsCount = useAtomValue(commonConnectionsCountAtom)
  const friendLevelInfo = useAtomValue(friendLevelInfoAtom)

  const setOpenedImageUri = useSetAtom(openedImageUriAtom)
  const showGoldenAvatarInfoModal = useSetAtom(
    showGoldenAvatarInfoModalActionAton
  )
  const otherSideGoldenAvatarType = useAtomValue(otherSideGoldenAvatarTypeAtom)

  const noImageUri =
    otherSideData.image.type === 'imageUri' && !otherSideData.image.imageUri
  const noGoldenAvatarType =
    !otherSideGoldenAvatarType ||
    (!offer?.ownershipInfo && !offer?.offerInfo.publicPart.goldenAvatarType)

  return (
    <Stack
      height={mode === 'photoTop' ? PHOTO_AND_INFO_PHOTO_TOP_HEIGHT : 'auto'}
      fd={mode === 'photoLeft' ? 'row' : 'column'}
      alignItems={mode === 'photoTop' ? 'center' : 'flex-start'}
    >
      <Stack
        w={40}
        h={40}
        {...(mode === 'photoTop' ? {marginBottom: '$1'} : {marginRight: '$2'})}
      >
        <TouchableOpacity
          disabled={noImageUri || noGoldenAvatarType}
          onPress={() => {
            if (otherSideData.image.type === 'imageUri')
              setOpenedImageUri(resolveLocalUri(otherSideData.image.imageUri))
            else if (
              !!otherSideGoldenAvatarType ||
              (!offer?.ownershipInfo &&
                offer?.offerInfo.publicPart.goldenAvatarType)
            )
              showGoldenAvatarInfoModal()
          }}
        >
          <UserAvatar
            grayScale={otherSideLeft || !canSendMessages}
            userImage={otherSideData.image}
            width={40}
            height={40}
          />
        </TouchableOpacity>
      </Stack>
      <YStack f={1}>
        <UserNameWithSellingBuying
          userName={otherSideData.userName}
          center={mode === 'photoTop'}
          offerInfo={offer ? offer.offerInfo : undefined}
        />
        <ContactTypeAndCommonNumber
          contactsHashes={commonConnectionsHashes}
          friendLevel={friendLevelInfo}
          numberOfCommonFriends={commonConnectionsCount}
          center={mode === 'photoTop'}
        />
      </YStack>
    </Stack>
  )
}

export default OtherSideNamePhotoAndInfo
