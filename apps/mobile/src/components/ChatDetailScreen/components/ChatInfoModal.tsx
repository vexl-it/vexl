import {Stack, YStack} from 'tamagui'
import {useAtomValue, useSetAtom} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {PHOTO_AND_INFO_PHOTO_TOP_HEIGHT} from './OtherSideNamePhotoAndInfo'
import AnimatedModal from '../../AnimatedModal'
import ChatRequestPreview from './ChatRequestPreview'
import IdentityIconSvg from '../images/identityIconSvg'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import ButtonStack from './ButtonStack'
import BlockIconSvg from '../../../images/blockIconSvg'
import WarningSvg from '../images/warningSvg'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {SlideInDown, SlideOutDown} from 'react-native-reanimated'
import {ScrollView} from 'react-native'
import {enableHiddenFeatures} from '../../../utils/environment'

function ChatInfoModal(): JSX.Element | null {
  const {
    showModalAtom,
    deleteChatWithUiFeedbackAtom,
    blockChatWithUiFeedbackAtom,
    canSendMessagesAtom,
  } = useMolecule(chatMolecule)
  const showModal = useAtomValue(showModalAtom)
  const {top} = useSafeAreaInsets()
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)
  const blockChat = useSetAtom(blockChatWithUiFeedbackAtom)
  const canSendMessages = useAtomValue(canSendMessagesAtom)

  if (!showModal) return null

  return (
    <AnimatedModal
      entering={SlideInDown}
      exiting={SlideOutDown}
      topMargin={PHOTO_AND_INFO_PHOTO_TOP_HEIGHT + top}
    >
      <YStack px={'$4'} backgroundColor="$black" f={1}>
        <ScrollView>
          <Stack mt={'$4'}>
            <ChatRequestPreview />
          </Stack>
          <Stack mt="$7"></Stack>
          <ButtonStack
            buttons={[
              ...(canSendMessages && enableHiddenFeatures
                ? [
                    {
                      icon: IdentityIconSvg,
                      isNegative: false,
                      text: t('messages.askToReveal'),
                      onPress: () => undefined, // TODO
                    },
                  ]
                : []),
              {
                icon: WarningSvg,
                isNegative: false,
                text: t('messages.deleteChat'),
                onPress: () => {
                  void deleteChat().then((success) => {
                    if (success) goBack()
                  })
                },
              },
              {
                icon: BlockIconSvg,
                isNegative: true,
                text: t('messages.blockUser'),
                onPress: () => {
                  void blockChat().then((success) => {
                    if (success) goBack()
                  })
                },
              },
            ]}
          />
          <Stack h={'$4'} />
        </ScrollView>
      </YStack>
    </AnimatedModal>
  )
}

export default ChatInfoModal
