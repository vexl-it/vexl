import {
  Button,
  ChevronLeft,
  KeyboardAvoidingView,
  NavigationBar,
  Screen,
  TextArea,
  Typography,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Effect, Option} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback, useRef, useState} from 'react'
import {Alert, Dimensions, Keyboard, Pressable} from 'react-native'
import {type RootStackScreenProps} from '../../navigationTypes'
import {sendRequestHandleUIActionAtom} from '../../state/chat/atoms/sendRequestActionAtom'
import {useSingleOffer} from '../../state/marketplace'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {globalDialogAtom} from '../GlobalDialog'
import OfferHeader from '../OfferDetailScreen/components/OfferHeader'

type Props = RootStackScreenProps<'SendMessage'>

function SendMessageScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()
  const offer = useSingleOffer(offerId)
  const submitRequest = useSetAtom(sendRequestHandleUIActionAtom)
  const showDialog = useSetAtom(globalDialogAtom)
  const textRef = useRef('')
  const [hasText, setHasText] = useState(false)

  const handleClose = useCallback(() => {
    navigation.popToTop()
  }, [navigation])

  const handleSend = useCallback(() => {
    const text = textRef.current
    if (!text.trim() || Option.isNone(offer)) return

    void Effect.runPromise(
      Effect.gen(function* (_) {
        const chat = yield* _(submitRequest({text, originOffer: offer.value}))

        const showSuccess = yield* _(
          showDialog({
            title: t('offer.messageSentTitle'),
            subtitle: t('offer.messageSentDescription'),
            positiveButtonText: t('offer.showChat'),
            negativeButtonText: t('common.close'),
          })
        )

        if (showSuccess) {
          navigation.replace('ChatDetail', {
            otherSideKey: chat.otherSide.publicKey,
            inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
          })
        } else {
          navigation.popToTop()
        }
      }).pipe(
        Effect.catchAll((e) => {
          if (e._tag === 'ReceiverInboxDoesNotExistError') {
            Alert.alert(t('common.error'), t('offer.offerNotFound'), [
              {text: t('common.close'), onPress: handleClose},
            ])
          }
          return Effect.void
        })
      )
    )
  }, [offer, submitRequest, showDialog, t, handleClose, navigation])

  const navigationBar = (
    <NavigationBar
      style="back"
      title={t('common.sendAMessage')}
      leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
      rightActions={[{icon: XmarkCancelClose, onPress: handleClose}]}
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
    <KeyboardAvoidingView>
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
            <OfferHeader offer={offer.value} />
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
    </KeyboardAvoidingView>
  )
}

export default SendMessageScreen
