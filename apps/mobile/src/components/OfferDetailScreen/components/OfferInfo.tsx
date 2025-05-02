import Clipboard from '@react-native-clipboard/clipboard'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Effect} from 'effect'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Alert} from 'react-native'
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, YStack, getTokens} from 'tamagui'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {sendRequestHandleUIActionAtom} from '../../../state/chat/atoms/sendRequestActionAtom'
import {type RequestState} from '../../../state/chat/domain'
import {useChatWithMessagesForOffer} from '../../../state/chat/hooks/useChatForOffer'
import {
  canChatBeRequested,
  getRequestState,
} from '../../../state/chat/utils/offerStates'
import {createSingleOfferReportedFlagAtom} from '../../../state/marketplace/atoms/offersState'
import {enableHiddenFeatures} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {
  friendLevelBannerPreferenceAtom,
  preferencesAtom,
} from '../../../utils/preferences'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {offerRerequestLimitDaysAtom} from '../../../utils/versionService/atoms'
import Button from '../../Button'
import ButtonWithPressTimeout from '../../ButtonWithPressTimeout'
import Info from '../../Info'
import {MAP_SIZE} from '../../MarketplaceMap'
import OfferRequestTextInput from '../../OfferRequestTextInput'
import OfferWithBubbleTip from '../../OfferWithBubbleTip'
import {toastNotificationAtom} from '../../ToastNotification/atom'
import infoSvg from '../../images/infoSvg'
import {showCommonFriendsExplanationActionAtom} from '../atoms'
import RerequestInfo from './RerequestInfo'
import Title from './Title'

const SCROLL_EXTRA_OFFSET = 200

function ContentContainer({
  mapIsVisible,
  children,
}: {
  mapIsVisible?: boolean
  children: React.ReactElement | React.ReactElement[]
}): JSX.Element {
  return mapIsVisible ? (
    <Stack>{children}</Stack>
  ) : (
    <KeyboardAwareScrollView
      showsVerticalScrollIndicator={false}
      extraHeight={SCROLL_EXTRA_OFFSET}
    >
      {children}
    </KeyboardAwareScrollView>
  )
}

function OfferInfo({
  mapIsVisible,
  offer,
  navigation,
}: {
  mapIsVisible?: boolean
  offer: OneOfferInState
  navigation: RootStackScreenProps<'OfferDetail'>['navigation']
}): JSX.Element {
  const goBack = useSafeGoBack()
  const {bottom} = useSafeAreaInsets()
  const toastBottomMargin = bottom + getTokens().space[5].val
  const {t} = useTranslation()
  const reportedFlagAtom = createSingleOfferReportedFlagAtom(
    offer.offerInfo.offerId
  )
  const showCommonFriendsExplanation = useSetAtom(
    showCommonFriendsExplanationActionAtom
  )
  const flagOffer = useSetAtom(reportedFlagAtom)
  const submitRequest = useSetAtom(sendRequestHandleUIActionAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const [text, setText] = useState('')
  const offerRerequestLimitDays = useAtomValue(offerRerequestLimitDaysAtom)
  const chatForOffer = useChatWithMessagesForOffer({
    offerPublicKey: offer.offerInfo.publicPart.offerPublicKey,
  })
  const preferences = useAtomValue(preferencesAtom)

  const requestState: RequestState = useMemo(
    () => (chatForOffer ? getRequestState(chatForOffer) : 'initial'),
    [chatForOffer]
  )
  const requestPossibleInfo = useMemo(() => {
    if (!chatForOffer)
      return {
        canBeRerequested: true,
      } as const

    return canChatBeRequested(chatForOffer, offerRerequestLimitDays)
  }, [chatForOffer, offerRerequestLimitDays])

  const friendLevel = (() => {
    if (offer.offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE'))
      return t('offer.directFriend')
    return t('offer.friendOfFriend')
  })()

  const onRequestPressed = useCallback(() => {
    if (!text.trim()) return
    void pipe(
      submitRequest({text, originOffer: offer}),
      TE.match(
        (e) => {
          if (e._tag === 'ReceiverInboxDoesNotExistError') {
            Alert.alert(t('common.error'), t('offer.offerNotFound'), [
              {
                text: t('common.close'),
                onPress: () => {
                  flagOffer(true)
                  goBack()
                },
              },
            ])
          }
        },
        (chat) => {
          navigation.replace('ChatDetail', {
            otherSideKey: chat.otherSide.publicKey,
            inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
          })
        }
      )
    )()
  }, [flagOffer, goBack, navigation, offer, submitRequest, t, text])

  const showRequestButton =
    !chatForOffer || requestPossibleInfo.canBeRerequested

  useEffect(() => {
    setToastNotification({
      visible: true,
      text: t(`offer.requestStatus.${requestState}`),
      icon: infoSvg,
      iconFill: getTokens().color.black.val,
      showCloseButton: true,
      hideAfterMillis: 3000,
      bottomMargin: mapIsVisible ? toastBottomMargin : undefined,
    })

    return () => {
      setToastNotification((prev) => ({...prev, visible: false}))
    }
  }, [mapIsVisible, requestState, setToastNotification, t, toastBottomMargin])

  return (
    <Stack f={1} mx="$2" my="$4">
      {!mapIsVisible && <Title offer={offer} />}
      <ContentContainer mapIsVisible={mapIsVisible}>
        <YStack gap="$2" mb="$2">
          <Stack mb="$2">
            <OfferWithBubbleTip
              showCommonFriends
              showListingType
              negative={!requestPossibleInfo.canBeRerequested}
              offer={offer}
            />
          </Stack>
          <Info
            visibleStateAtom={friendLevelBannerPreferenceAtom}
            text={t('common.whatDoesThisMean', {term: friendLevel})}
            actionButtonText={t('common.learnMore')}
            onActionPress={() => {
              Effect.runFork(showCommonFriendsExplanation(offer.offerInfo))
            }}
          />
          {!!showRequestButton && (
            <OfferRequestTextInput text={text} onChange={setText} />
          )}
          {!showRequestButton &&
            (requestState === 'cancelled' || requestState === 'deleted') && (
              <RerequestInfo chat={chatForOffer} />
            )}
          {!!(!!enableHiddenFeatures || preferences.showOfferDetail) && (
            <Text
              onPress={() => {
                Clipboard.setString(JSON.stringify(offer, null, 2))
                Alert.alert(t('common.copied'))
              }}
            >
              {JSON.stringify(offer, null, 2)}
            </Text>
          )}
        </YStack>
      </ContentContainer>
      <Stack pt="$2">
        {showRequestButton ? (
          <ButtonWithPressTimeout
            disabled={!text.trim()}
            onPress={onRequestPressed}
            variant="secondary"
            text={t('offer.sendRequest')}
          />
        ) : requestState !== 'cancelled' && requestState !== 'deleted' ? (
          <Button
            onPress={() => {
              if (!chatForOffer) return
              navigation.navigate('ChatDetail', {
                otherSideKey: chatForOffer.chat.otherSide.publicKey,
                inboxKey: chatForOffer.chat.inbox.privateKey.publicKeyPemBase64,
              })
            }}
            variant="primary"
            text={t('offer.goToChat')}
          />
        ) : null}
      </Stack>
      {/* Needed to map scroll animation work correctly */}
      {!!mapIsVisible && <Stack h={MAP_SIZE + MAP_SIZE / 2} />}
    </Stack>
  )
}

export default OfferInfo
