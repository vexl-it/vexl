import {useNavigation} from '@react-navigation/native'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {extractPartsOfNotificationCypher} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {useMolecule} from 'bunshi/dist/react'
import {Effect, Option} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect, useState} from 'react'
import {Alert, ScrollView} from 'react-native'
import {getFontScaleSync} from 'react-native-device-info'
import {SlideInDown, SlideOutDown} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, YStack, getTokens} from 'tamagui'
import BlockIconSvg from '../../../images/blockIconSvg'
import tradeChecklistSvg from '../../../images/tradeChecklistSvg'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {preferencesAtom} from '../../../utils/preferences'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import AnimatedModal from '../../AnimatedModal'
import {reportOfferActionAtom} from '../../OfferDetailScreen/atoms'
import flagSvg from '../../OfferDetailScreen/images/flagSvg'
import ParticipatedInMeetup from '../../ParticipatedInMeetup'
import IdentityIconSvg from '../../images/identityIconSvg'
import {chatMolecule} from '../atoms'
import vexlbotNotificationsSvg from '../images/vexlbotNotificationsSvg'
import WarningSvg from '../images/warningSvg'
import ButtonStack from './ButtonStack'
import ChatRequestPreview from './ChatRequestPreview'
import {PHOTO_AND_INFO_PHOTO_TOP_HEIGHT} from './OtherSideNamePhotoAndInfo'

function NotificationTokenDebug({chat}: {chat: Chat}): JSX.Element {
  const [lastReportedTokenS, setLastReportedTokenS] = useState('none')
  const [lastReceivedTokenS, setLastReceviedTokenS] = useState('none')

  useEffect(() => {
    const lastReportedToken = chat.lastReportedFcmToken?.cypher
    const lastReceivedToken = chat.otherSideFcmCypher

    try {
      if (lastReportedToken) {
        const parts = pipe(
          extractPartsOfNotificationCypher({
            notificationCypher: lastReportedToken,
          }),
          Option.getOrElse(() => 'none')
        )
        setLastReportedTokenS(JSON.stringify(parts, null, 2))
      } else setLastReportedTokenS('none')
    } catch (e) {
      setLastReportedTokenS(`error: ${(e as any)?.message ?? 'unknown'}`)
    }

    try {
      if (lastReceivedToken) {
        const parts = pipe(
          extractPartsOfNotificationCypher({
            notificationCypher: lastReceivedToken,
          }),
          Option.getOrElse(() => 'none')
        )
        setLastReceviedTokenS(JSON.stringify(parts, null, 2))
      } else setLastReceviedTokenS('none')
    } catch (e) {
      setLastReceviedTokenS(`error: ${(e as any)?.message ?? 'unknown'}`)
    }
  }, [chat, setLastReportedTokenS, setLastReceviedTokenS])

  return (
    <>
      <Text>Last reported cypher: {lastReportedTokenS}</Text>
      <Text> gotNotificationToken: {lastReceivedTokenS}</Text>
      <Text>
        last reported token:{' '}
        {JSON.stringify(chat.lastReportedFcmToken, null, 2)}
      </Text>
    </>
  )
}

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
    otherSideSupportsTradingChecklistAtom,
    chatAtom,
    listingTypeIsOtherAtom,
  } = useMolecule(chatMolecule)
  const fontScale = getFontScaleSync()
  const [showModal, setShowModal] = useAtom(showModalAtom)
  const {top} = useSafeAreaInsets()
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const navigation = useNavigation()
  const resetNavigationToMessagingScreen = useResetNavigationToMessagingScreen()
  const reportOffer = useSetAtom(reportOfferActionAtom)

  const deleteChatWithUiFeedback = useSetAtom(deleteChatWithUiFeedbackAtom)
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
  const chat = useAtomValue(chatAtom)
  const otherSideSupportsTradingChecklist = useAtomValue(
    otherSideSupportsTradingChecklistAtom
  )
  const listingTypeIsOther = useAtomValue(listingTypeIsOtherAtom)
  const {showOfferDetail} = useAtomValue(preferencesAtom)

  if (!showModal) return null

  return (
    <AnimatedModal
      entering={SlideInDown}
      exiting={SlideOutDown}
      topMargin={PHOTO_AND_INFO_PHOTO_TOP_HEIGHT * fontScale + top}
    >
      <YStack px="$4" backgroundColor="$black" f={1}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Stack mt="$4" mb="$7">
            <ChatRequestPreview mode="offerFirst" />
          </Stack>
          {!!showOfferDetail && (
            <>
              <Text>
                Last reported version: {chat.lastReportedVersion ?? 'none'} :
                gotVersion: {chat.otherSideVersion ?? 'none'}
              </Text>
              <NotificationTokenDebug chat={chat} />
              <Text>(this will NOT be visible in production)</Text>
            </>
          )}
          {chat.origin.type === 'theirOffer' &&
            !!offerForChat?.offerInfo.publicPart.goldenAvatarType && (
              <Stack mb="$7">
                <ParticipatedInMeetup />
              </Stack>
            )}
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
                        void Effect.runPromise(
                          andThenExpectBooleanNoErrors((success) => {
                            if (success) goBack()
                          })(reportOffer(offerForChat))
                        )
                      },
                    },
                  ]
                : []),

              ...(otherSideSupportsTradingChecklist && !listingTypeIsOther
                ? [
                    {
                      icon: tradeChecklistSvg,
                      isNegative: false,
                      text: t('messages.tradeChecklist'),
                      iconFill: getTokens().color.greyOnBlack.val,
                      onPress: () => {
                        if (!otherSideSupportsTradingChecklist) {
                          Alert.alert(
                            t('tradeChecklist.notSupportedByOtherSide.title'),
                            t('tradeChecklist.notSupportedByOtherSide.body')
                          )
                          return
                        }
                        setShowModal(false)
                        navigation.navigate('TradeChecklistFlow', {
                          screen: 'AgreeOnTradeDetails',
                          chatId,
                          inboxKey,
                        })
                      },
                    },
                  ]
                : []),
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
              {
                icon: WarningSvg,
                isNegative: false,
                text: t('messages.deleteChat'),
                onPress: () => {
                  void Effect.runPromise(
                    andThenExpectBooleanNoErrors((success) => {
                      if (success) {
                        resetNavigationToMessagingScreen()
                      }
                    })(deleteChatWithUiFeedback({skipAsk: false}))
                  )
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
