import {useNavigation} from '@react-navigation/native'
import {XStack, YStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, useTheme} from 'tamagui'
import {type RootStackScreenProps} from '../../../navigationTypes'
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

function OtherSideNamePhotoAndInfo({mode}: Props): React.ReactElement {
  const theme = useTheme()
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {
    offerForChatAtom,
    otherSideDataAtom,
    otherSideClubsIdsAtom,
    otherSideLeftAtom,
    canSendMessagesAtom,
    commonConnectionsCountAtom,
    commonConnectionsHashesAtom,
    verifiedConnectionsHashesAtom,
    friendLevelInfoAtom,
    otherSideGoldenAvatarTypeAtom,
  } = useMolecule(chatMolecule)

  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const otherSideLeft = useAtomValue(otherSideLeftAtom)

  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const otherSideClubsIds = useAtomValue(otherSideClubsIdsAtom)
  const verifiedConnectionsHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const commonConnectionsCount = useAtomValue(commonConnectionsCountAtom)
  const friendLevelInfo = useAtomValue(friendLevelInfoAtom)

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
    <XStack
      alignItems="center"
      gap={mode === 'photoTop' ? '$0' : '$3'}
      justifyContent={mode === 'photoTop' ? 'center' : 'flex-start'}
    >
      <Stack
        width={40}
        height={40}
        marginBottom={mode === 'photoTop' ? '$2' : '$0'}
        marginRight={mode === 'photoTop' ? '$0' : '$0'}
      >
        <TouchableOpacity
          disabled={noImageUri || noGoldenAvatarType}
          onPress={() => {
            if (otherSideData.image.type === 'imageUri')
              navigation.navigate('ChatImagePreview', {
                imageUri: resolveLocalUri(otherSideData.image.imageUri),
              })
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
          verifiedHashes={verifiedConnectionsHashes}
          friendLevel={friendLevelInfo}
          numberOfCommonFriends={commonConnectionsCount}
          center={mode === 'photoTop'}
          clubsIds={otherSideClubsIds}
        />
      </YStack>
    </XStack>
  )
}

export default OtherSideNamePhotoAndInfo
