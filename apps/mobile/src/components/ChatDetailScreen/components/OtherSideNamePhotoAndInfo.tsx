import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {Stack, YStack} from 'tamagui'
import ContactTypeAndCommonNumber from '../../ContactTypeAndCommonNumber'
import UserAvatar from '../../UserAvatar'
import UserNameWithSellingBuying from '../../UserNameWithSellingBuying'
import {chatMolecule} from '../atoms'
import UserAvatarTouchableWrapper from './UserAvatarTouchableWrapper'

interface Props {
  mode: 'photoTop' | 'photoLeft'
}

export const PHOTO_AND_INFO_PHOTO_TOP_HEIGHT = 81 + 16

function OtherSideNamePhotoAndInfo({mode}: Props): JSX.Element {
  const {
    offerForChatAtom,
    otherSideDataAtom,
    otherSideLeftAtom,
    canSendMessagesAtom,
    commonConnectionsCountAtom,
    friendLevelInfoAtom,
  } = useMolecule(chatMolecule)

  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const otherSideLeft = useAtomValue(otherSideLeftAtom)
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const commonConnectionsCount = useAtomValue(commonConnectionsCountAtom)
  const friendLevelInfo = useAtomValue(friendLevelInfoAtom)

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
        <UserAvatarTouchableWrapper
          userImageUri={
            otherSideData.image.type === 'imageUri'
              ? otherSideData.image.imageUri
              : undefined
          }
        >
          <UserAvatar
            grayScale={otherSideLeft || !canSendMessages}
            userImage={otherSideData.image}
            width={40}
            height={40}
          />
        </UserAvatarTouchableWrapper>
      </Stack>
      <YStack f={1}>
        <UserNameWithSellingBuying
          userName={otherSideData.userName}
          center={mode === 'photoTop'}
          offerInfo={
            offer
              ? {
                  offerType: offer.offerInfo.publicPart.offerType,
                  offerDirection: offer.ownershipInfo?.adminId
                    ? 'myOffer'
                    : 'theirOffer',
                }
              : undefined
          }
        />
        <ContactTypeAndCommonNumber
          friendLevel={friendLevelInfo}
          numberOfCommonFriends={commonConnectionsCount}
          center={mode === 'photoTop'}
        />
      </YStack>
    </Stack>
  )
}

export default OtherSideNamePhotoAndInfo
