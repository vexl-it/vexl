import {Stack, Text, XStack, YStack} from 'tamagui'
import ChatDisplayName from '../../ChatDisplayName'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import friendsSvg from '../images/friendsSvg'
import Image from '../../Image'
import {useAtomValue} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import UserAvatar from '../../UserAvatar'

interface Props {
  mode: 'photoTop' | 'photoLeft'
}

export const PHOTO_AND_INFO_PHOTO_TOP_HEIGHT = 81 + 16

function OtherSideNamePhotoAndInfo({mode}: Props): JSX.Element {
  const {
    chatAtom,
    offerForChatAtom,
    otherSideDataAtom,
    otherSideLeftAtom,
    canSendMessagesAtom,
  } = useMolecule(chatMolecule)
  const {t} = useTranslation()

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
        <ChatDisplayName chatAtom={chatAtom} center={mode === 'photoTop'} />
        <XStack
          space="$1"
          justifyContent={mode === 'photoTop' ? 'center' : 'flex-start'}
          alignItems={'center'}
        >
          <Text color="$greyOnBlack">
            {offer?.offerInfo.privatePart?.friendLevel?.includes(
              'SECOND_DEGREE'
            ) ? (
              <Text>{t('offer.friendOfFriend')}</Text>
            ) : (
              offer?.offerInfo.privatePart?.friendLevel?.includes(
                'FIRST_DEGREE'
              ) && <Text>{t('offer.directFriend')}</Text>
            )}
          </Text>
          <Text color="$greyOnBlack">•</Text>
          <Stack w={14} h={14}>
            <Image source={friendsSvg} />
          </Stack>
          <Text color={'$greyOnBlack'}>
            {t('offer.numberOfCommon', {
              number: offer?.offerInfo.privatePart?.commonFriends?.length ?? 0,
            })}
          </Text>
        </XStack>
      </YStack>
    </Stack>
  )
}

export default OtherSideNamePhotoAndInfo
