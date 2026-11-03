import {CommonActions} from '@react-navigation/native'
import {
  Button,
  DismissKeyboardOnPressOutside,
  ChevronLeft,
  EmptyState,
  LabeledTextArea,
  NavigationBar,
  Screen,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Array, Effect, Option} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import {Alert, Dimensions} from 'react-native'
import {type RootStackScreenProps} from '../../navigationTypes'
import {sendRequestHandleUIActionAtom} from '../../state/chat/atoms/sendRequestActionAtom'
import {useSingleOffer} from '../../state/marketplace'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import OfferAuthorBanner from '../OfferAuthorBanner'

type Props = RootStackScreenProps<'SendMessage'>

function SendMessageScreen({
  route: {
    params: {offerId, mode = 'request'},
  },
  navigation,
}: Props): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()
  const offer = useSingleOffer(offerId)
  const submitRequest = useSetAtom(sendRequestHandleUIActionAtom)
  const [text, setText] = useState('')
  const hasText = text.trim().length > 0

  const handleClose = useCallback(() => {
    navigation.popToTop()
  }, [navigation])

  const openChatDetailReplacingRequestFlow = useCallback(
    (params: RootStackScreenProps<'ChatDetail'>['route']['params']) => {
      navigation.dispatch((state) => {
        const routesWithoutSendMessage = Array.dropRight(state.routes, 1)
        const previousRoute =
          routesWithoutSendMessage[routesWithoutSendMessage.length - 1]
        const routesToKeep =
          previousRoute?.name === 'OfferDetail'
            ? Array.dropRight(routesWithoutSendMessage, 1)
            : routesWithoutSendMessage

        return CommonActions.reset({
          ...state,
          routes: [...routesToKeep, {name: 'ChatDetail', params}],
          index: routesToKeep.length,
        })
      })
    },
    [navigation]
  )

  const handleSend = useCallback(() => {
    if (!hasText || Option.isNone(offer)) return

    void Effect.runPromise(
      Effect.gen(function* (_) {
        const chat = yield* _(submitRequest({text, originOffer: offer.value}))

        if (mode === 'rerequest') {
          safeGoBack()
          return
        }

        openChatDetailReplacingRequestFlow({
          otherSideKey: chat.otherSide.publicKey,
          inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
        })
      }).pipe(
        Effect.catchAll((e) => {
          if (e._tag === 'ReceiverInboxDoesNotExistError') {
            Alert.alert(t('common.error'), t('offer.offerNotFound'), [
              {text: t('common.close')},
            ])
            return Effect.void
          }

          Alert.alert(t('common.error'), 'error', [
            {text: t('common.close'), onPress: handleClose},
          ])
          console.log(e)

          return Effect.void
        })
      )
    )
  }, [
    text,
    hasText,
    offer,
    submitRequest,
    t,
    safeGoBack,
    handleClose,
    mode,
    openChatDetailReplacingRequestFlow,
  ])

  const navigationBar = (
    <NavigationBar
      style="back"
      title={t('common.sendAMessage')}
      leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
      rightActions={
        mode === 'request'
          ? [{icon: XmarkCancelClose, onPress: handleClose}]
          : []
      }
    />
  )

  if (Option.isNone(offer)) {
    return (
      <Screen navigationBar={navigationBar}>
        <EmptyState
          fullscreen
          title={t('offer.offerNotFound')}
          action={{
            label: t('common.back'),
            onPress: safeGoBack,
            variant: 'primary',
          }}
        />
      </Screen>
    )
  }

  return (
    <Screen
      navigationBar={navigationBar}
      footer={
        <Button
          variant={hasText ? 'primary' : 'disabled'}
          disabled={!hasText}
          onPress={handleSend}
        >
          {t('common.send')}
        </Button>
      }
    >
      <DismissKeyboardOnPressOutside>
        <YStack flex={1} gap="$5">
          <OfferAuthorBanner offer={offer.value} />
          <LabeledTextArea
            minHeight={Dimensions.get('window').height * 0.3}
            placeholder={t('offer.sendMessagePlaceholder')}
            value={text}
            onChangeText={setText}
          />
        </YStack>
      </DismissKeyboardOnPressOutside>
    </Screen>
  )
}

export default SendMessageScreen
