import Clipboard from '@react-native-clipboard/clipboard'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Alert} from 'react-native'
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller'
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
import OfferRequestTextInput from '../../OfferRequestTextInput'
import OfferWithBubbleTip from '../../OfferWithBubbleTip'
import {toastNotificationAtom} from '../../ToastNotification/atom'
import infoSvg from '../../images/infoSvg'
import {showCommonFriendsExplanationActionAtom} from '../atoms'
import RerequestInfo from './RerequestInfo'
import Title from './Title'

const BOTTOM_SCROLL_OFFSET = 250

function OfferInfo({
  mapIsVisible,
  offer,
  navigation,
}: {
  mapIsVisible?: boolean
  offer: OneOfferInState
  navigation: RootStackScreenProps<'OfferDetail'>['navigation']
}): React.ReactElement {
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
    offerId: offer.offerInfo.offerId,
    isMyOffer: !!offer.ownershipInfo,
    otherSidePublicKey: offer.offerInfo.publicPart.offerPublicKey,
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
      effectToTaskEither(submitRequest({text, originOffer: offer})),
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

  const isOnlyClubOffer =
    offer.offerInfo.privatePart.friendLevel.length === 1 &&
    offer.offerInfo.privatePart.friendLevel[0] === 'CLUB'

  const ContentContainer = offer.offerInfo.publicPart.locationState.includes(
    'IN_PERSON'
  )
    ? YStack
    : KeyboardAwareScrollView

  const ButtonsContainer = offer.offerInfo.publicPart.locationState.includes(
    'IN_PERSON'
  )
    ? YStack
    : KeyboardStickyView

  return (
    <Stack f={1} mx="$2" my="$4">
      {!mapIsVisible && <Title offer={offer} />}
      <ContentContainer bottomOffset={BOTTOM_SCROLL_OFFSET}>
        <YStack gap="$2" mb="$2">
          <Stack mb="$2">
            <OfferWithBubbleTip
              showCommonFriends
              showListingType
              negative={!requestPossibleInfo.canBeRerequested}
              offer={offer}
            />
          </Stack>
          {!isOnlyClubOffer && (
            <Info
              visibleStateAtom={friendLevelBannerPreferenceAtom}
              text={t('common.whatDoesThisMean', {term: friendLevel})}
              actionButtonText={t('common.learnMore')}
              onActionPress={() => {
                Effect.runFork(showCommonFriendsExplanation(offer.offerInfo))
              }}
            />
          )}
          {!!showRequestButton && (
            <OfferRequestTextInput text={text} onChange={setText} />
          )}
          {!showRequestButton &&
            (requestState === 'cancelled' || requestState === 'deleted') && (
              <RerequestInfo chat={chatForOffer} />
            )}
        </YStack>
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
      </ContentContainer>
      <ButtonsContainer offset={{closed: 10, opened: 30}}>
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
                  inboxKey:
                    chatForOffer.chat.inbox.privateKey.publicKeyPemBase64,
                })
              }}
              variant="primary"
              text={t('offer.goToChat')}
            />
          ) : null}
        </Stack>
      </ButtonsContainer>
    </Stack>
  )
}

export default OfferInfo
