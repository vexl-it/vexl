import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import Image from '../../Image'
import bubbleTypTopSvg from '../images/bubbleTypTopSvg'
import OfferInfoPreview from '../../OfferInfoPreview'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useMolecule} from 'bunshi/dist/react'
import {chatMolecule} from '../atoms'
import {useAtomValue} from 'jotai'
import CommonFriends from '../../CommonFriends'
import flagSvg from '../../OfferDetailScreen/images/flagSvg'

function ChatRequestPreview({
  mode,
  showRequestMessage,
}: {
  mode: 'commonFirst' | 'offerFirst'
  showRequestMessage?: boolean
}): JSX.Element {
  const tokens = getTokens()
  const {
    offerForChatAtom,
    chatAtom,
    commonConnectionsHashesAtom,
    requestMessageAtom,
  } = useMolecule(chatMolecule)

  const chat = useAtomValue(chatAtom)
  const offer = useAtomValue(offerForChatAtom)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const requestMessage = useAtomValue(requestMessageAtom)

  const {t} = useTranslation()

  const commonFriendsSection = (
    <>
      {commonConnectionsHashes && commonConnectionsHashes.length > 0 && (
        <Stack mx={'$-4'}>
          <CommonFriends
            hideCommonFriendsCount
            contactsHashes={commonConnectionsHashes}
            variant={'light'}
          />
        </Stack>
      )}
    </>
  )

  const requestMessageSection = (
    <>
      {requestMessage?.message.text ? (
        <Text fos={20} color="$black" fontFamily="$body500">
          {requestMessage?.message.text}
        </Text>
      ) : (
        <Text fos={20} color="$greyOnWhite" fontFamily="$body500">
          {t('messages.requestMessageWasDeleted')}
        </Text>
      )}
    </>
  )

  const offerInfoPreviewSection = (
    <>
      {offer?.flags.reported && (
        <XStack
          borderRadius={'$true'}
          mx={'$-4'}
          px={'$4'}
          py={'$4'}
          bg={'$darkRed'}
          space={'$2'}
        >
          <Image source={flagSvg} stroke={tokens.color.red.val} />
          <Text fos={16} col={'$red'}>
            {t('messages.offerWasReported')}
          </Text>
        </XStack>
      )}
      <Stack
        borderRadius={'$true'}
        mx={'$-4'}
        px={'$4'}
        py={'$4'}
        backgroundColor="$greyAccent5"
      >
        <Text fontFamily={'$body600'} mb="$2" fos={14} col={'$greyOnWhite'}>
          {chat.origin.type === 'myOffer'
            ? t('messages.yourOffer')
            : t('messages.theirOffer')}
        </Text>
        {offer && <OfferInfoPreview offer={offer.offerInfo} />}
      </Stack>
    </>
  )

  return (
    <Stack>
      <Stack pos="absolute" t={-8} l={0} r={0} alignItems={'center'}>
        <Image source={bubbleTypTopSvg} />
      </Stack>
      <YStack
        pos={'relative'}
        backgroundColor="$white"
        borderRadius="$7"
        pt="$6"
        pb="$2"
        px="$6"
        space="$4"
      >
        {offer?.flags.reported && (
          <XStack
            borderRadius={'$true'}
            mx={'$-4'}
            px={'$4'}
            py={'$4'}
            bg={'$darkRed'}
            space={'$2'}
          >
            <Image source={flagSvg} stroke={tokens.color.red.val} />
            <Text fos={16} col={'$red'}>
              {t('messages.offerWasReported')}
            </Text>
          </XStack>
        )}
        {showRequestMessage && requestMessageSection}
        {mode === 'commonFirst' ? (
          <YStack space={'$4'}>
            {commonFriendsSection}
            {offerInfoPreviewSection}
          </YStack>
        ) : (
          <Stack space={'$4'}>
            {offerInfoPreviewSection}
            {commonFriendsSection}
          </Stack>
        )}
      </YStack>
    </Stack>
  )
}

export default ChatRequestPreview
