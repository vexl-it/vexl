import {Stack, Text, YStack} from 'tamagui'
import Image from '../../Image'
import bubbleTypTopSvg from '../images/bubbleTypTopSvg'
import OfferInfoPreview from '../../OfferInfoPreview'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue} from 'jotai'

function ChatRequestPreview(): JSX.Element {
  const {offerForChatAtom, chatAtom, requestMessageAtom} =
    useMolecule(chatMolecule)

  const chat = useAtomValue(chatAtom)
  const offer = useAtomValue(offerForChatAtom)

  const requestMessage = useAtomValue(requestMessageAtom)

  const {t} = useTranslation()

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
        {requestMessage?.message.text ? (
          <Text fos={20} color="$black" fontFamily="$body500">
            {requestMessage?.message.text}
          </Text>
        ) : (
          <Text fos={20} color="$greyOnWhite" fontFamily="$body500">
            {t('messages.requestMessageWasDeleted')}
          </Text>
        )}

        {/* TODO friends */}
        <Stack
          borderRadius={'$true'}
          mx={'$-4'}
          px={'$4'}
          py={'$4'}
          backgroundColor="$greyAccent5"
        >
          <Text fontFamily={'$body600'} mb="$2" fos={14} col={'$greyOnWhite'}>
            {chat ? t('messages.yourOffer') : t('messages.theirOffer')}
          </Text>
          {offer && <OfferInfoPreview offer={offer.offerInfo} />}
        </Stack>
      </YStack>
    </Stack>
  )
}

export default ChatRequestPreview
