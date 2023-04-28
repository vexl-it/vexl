import {Stack, YStack} from 'tamagui'
import {useAtomValue} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import UserAvatar from '../../UserAvatar'
import UserNameWithSellingBuying from '../../UserNameWithSellingBuying'
import ContactTypeAndCommonNumber from '../../ContactTypeAndCommonNumber'

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
  } = useMolecule(chatMolecule)

  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const otherSideLeft = useAtomValue(otherSideLeftAtom)
  const canSendMessages = useAtomValue(canSendMessagesAtom)

  return (
    <Stack
      height={mode === 'photoTop' ? PHOTO_AND_INFO_PHOTO_TOP_HEIGHT : 40}
      fd={mode === 'photoLeft' ? 'row' : 'column'}
      alignItems={mode === 'photoTop' ? 'center' : 'flex-start'}
    >
      <Stack
        w={40}
        h={40}
        {...(mode === 'photoTop' ? {marginBottom: '$1'} : {marginRight: '$2'})}
      >
        <UserAvatar
          grayScale={otherSideLeft || !canSendMessages}
          userImage={otherSideData.image}
          width={40}
          height={40}
        />
      </Stack>
      <YStack>
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
          friendLevel={offer?.offerInfo.privatePart.friendLevel ?? []}
          numberOfCommonFriends={
            offer?.offerInfo.privatePart.commonFriends.length ?? 0
          }
          center={mode === 'photoTop'}
        />
      </YStack>
    </Stack>
  )
}

export default OtherSideNamePhotoAndInfo
