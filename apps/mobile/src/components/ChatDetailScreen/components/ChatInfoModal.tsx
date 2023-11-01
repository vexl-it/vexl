import {getTokens, Stack, YStack} from 'tamagui'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {PHOTO_AND_INFO_PHOTO_TOP_HEIGHT} from './OtherSideNamePhotoAndInfo'
import AnimatedModal from '../../AnimatedModal'
import ChatRequestPreview from './ChatRequestPreview'
import IdentityIconSvg from '../../images/identityIconSvg'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import ButtonStack from './ButtonStack'
import BlockIconSvg from '../../../images/blockIconSvg'
import WarningSvg from '../images/warningSvg'
import {SlideInDown, SlideOutDown} from 'react-native-reanimated'
import {ScrollView} from 'react-native'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import flagSvg from '../../OfferDetailScreen/images/flagSvg'
import {useReportOfferHandleUI} from '../../OfferDetailScreen/api'
import tradeChecklistSvg from '../../../images/tradeChecklistSvg'
import vexlbotNotificationsSvg from '../images/vexlbotNotificationsSvg'
import {preferencesAtom} from '../../../utils/preferences'
import {useNavigation} from '@react-navigation/native'

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
      <YStack px={'$4'} backgroundColor="$black" f={1}>
        <ScrollView>
          <Stack mt={'$4'} mb={'$7'}>
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
          <Stack h={'$4'} />
        </ScrollView>
      </YStack>
    </AnimatedModal>
  )
}

export default ChatInfoModal
