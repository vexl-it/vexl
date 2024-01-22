import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {ScrollView} from 'react-native'
import {SlideInDown, SlideOutDown} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, YStack, getTokens} from 'tamagui'
import BlockIconSvg from '../../../images/blockIconSvg'
import tradeChecklistSvg from '../../../images/tradeChecklistSvg'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {preferencesAtom} from '../../../utils/preferences'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import AnimatedModal from '../../AnimatedModal'
import {useReportOfferHandleUI} from '../../OfferDetailScreen/api'
import flagSvg from '../../OfferDetailScreen/images/flagSvg'
import IdentityIconSvg from '../../images/identityIconSvg'
import {chatMolecule} from '../atoms'
import vexlbotNotificationsSvg from '../images/vexlbotNotificationsSvg'
import WarningSvg from '../images/warningSvg'
import ButtonStack from './ButtonStack'
import ChatRequestPreview from './ChatRequestPreview'
import {PHOTO_AND_INFO_PHOTO_TOP_HEIGHT} from './OtherSideNamePhotoAndInfo'

function ChatInfoModal(): JSX.Element | null {
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    offerForChatAtom,
    theirOfferAndNotReportedAtom,
    showModalAtom,
    deleteChatWithUiFeedbackAtom,
    blockChatWithUiFeedbackAtom,
    canSendMessagesAtom,
    revealIdentityWithUiFeedbackAtom,
    identityRevealStatusAtom,
    showVexlbotNotificationsForCurrentChatAtom,
  } = useMolecule(chatMolecule)
  const [showModal, setShowModal] = useAtom(showModalAtom)
  const {top} = useSafeAreaInsets()
  const {t} = useTranslation()
  const navigation = useNavigation()
  const resetNavigationToMessagingScreen = useResetNavigationToMessagingScreen()
  const reportOffer = useReportOfferHandleUI()

  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)
  const blockChat = useSetAtom(blockChatWithUiFeedbackAtom)
  const requestReveal = useSetAtom(revealIdentityWithUiFeedbackAtom)
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const offerForChat = useAtomValue(offerForChatAtom)
  const theirOfferAndNotReported = useAtomValue(theirOfferAndNotReportedAtom)
  const [showVexlbotNotifications, setShowVexlbotNotifications] = useAtom(
    showVexlbotNotificationsForCurrentChatAtom
  )
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const preferences = useAtomValue(preferencesAtom)

  if (!showModal) return null

  return (
    <AnimatedModal
      entering={SlideInDown}
      exiting={SlideOutDown}
      topMargin={PHOTO_AND_INFO_PHOTO_TOP_HEIGHT + top}
    >
      <YStack px="$4" backgroundColor="$black" f={1}>
        <ScrollView>
          <Stack mt="$4" mb="$7">
            <ChatRequestPreview mode="offerFirst" />
          </Stack>
          <ButtonStack
            buttons={[
              ...(canSendMessages && identityRevealStatus === 'notStarted'
                ? [
                    {
                      icon: IdentityIconSvg,
                      isNegative: false,
                      text: t('messages.askToReveal'),
                      onPress: () => {
                        void requestReveal('REQUEST_REVEAL').then((success) => {
                          if (success) setShowModal(false)
                        })
                      },
                    },
                  ]
                : []),
              ...(theirOfferAndNotReported && offerForChat
                ? [
                    {
                      icon: flagSvg,
                      isNegative: false,
                      text: t('messages.reportOffer'),
                      onPress: () => {
                        void reportOffer(offerForChat.offerInfo.offerId)()
                      },
                    },
                  ]
                : []),
              ...(preferences.tradeChecklistEnabled
                ? [
                    {
                      icon: tradeChecklistSvg,
                      isNegative: false,
                      text: t('messages.tradeChecklist'),
                      iconFill: getTokens().color.greyOnBlack.val,
                      onPress: () => {
                        setShowModal(false)
                        navigation.navigate('TradeChecklistFlow', {
                          screen: 'AgreeOnTradeDetails',
                          chatId,
                          inboxKey,
                        })
                      },
                    },
                    {
                      icon: vexlbotNotificationsSvg,
                      isNegative: false,
                      displaySwitch: true,
                      text: t('messages.vexlbotNotifications'),
                      iconFill: getTokens().color.greyOnBlack.val,
                      switchValue: showVexlbotNotifications,
                      onPress: () => {
                        // I know this rerenders all buttons but maybe most "code clean" way?
                        setShowVexlbotNotifications(!showVexlbotNotifications)
                      },
                    },
                  ]
                : []),
              {
                icon: WarningSvg,
                isNegative: false,
                text: t('messages.deleteChat'),
                onPress: () => {
                  void deleteChat().then((success) => {
                    if (success) {
                      resetNavigationToMessagingScreen()
                    }
                  })
                },
              },
              {
                icon: BlockIconSvg,
                isNegative: true,
                text: t('messages.blockUser'),
                onPress: () => {
                  void blockChat().then((success) => {
                    if (success) resetNavigationToMessagingScreen()
                  })
                },
              },
            ]}
          />
          <Stack h="$4" />
        </ScrollView>
      </YStack>
    </AnimatedModal>
  )
}

export default ChatInfoModal
