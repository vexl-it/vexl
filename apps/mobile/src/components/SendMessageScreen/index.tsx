import {CommonActions} from '@react-navigation/native'
import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  TextArea,
  Typography,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Array, Effect, Option} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback, useRef, useState} from 'react'
import {Alert, Dimensions, Keyboard, Pressable} from 'react-native'
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
  const textRef = useRef('')
  const [hasText, setHasText] = useState(false)

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
    const text = textRef.current
    if (!text.trim() || Option.isNone(offer)) return

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
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$5">
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {t('offer.offerNotFound')}
          </Typography>
          <Button variant="primary" onPress={safeGoBack} width="100%">
            {t('common.back')}
          </Button>
        </YStack>
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
      <Pressable style={{flex: 1}} onPress={Keyboard.dismiss}>
        <YStack gap="$5">
          <OfferAuthorBanner offer={offer.value} />
          <TextArea
            height={Dimensions.get('window').height * 0.3}
            backgroundColor="$backgroundTertiary"
            borderRadius="$5"
            padding="$6"
            placeholder={t('offer.sendMessagePlaceholder')}
            placeholderTextColor="$foregroundSecondary"
            defaultValue=""
            onChangeText={(val) => {
              textRef.current = val
              const nonEmpty = val.trim().length > 0
              if (nonEmpty !== hasText) setHasText(nonEmpty)
            }}
            fontFamily="$body"
            fontSize="$5"
            lineHeight={24}
            fontWeight="500"
            color="$foregroundPrimary"
            verticalAlign="top"
            borderWidth={0}
          />
        </YStack>
      </Pressable>
    </Screen>
  )
}

export default SendMessageScreen
