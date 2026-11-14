import {useNavigation} from '@react-navigation/native'
import {type OfferType} from '@vexl-next/domain/src/general/offers'
import {Button, Typography, XStack, YStack} from '@vexl-next/ui'
import {Option} from 'effect'
import React from 'react'
import {quickConnectAskedText} from '../../../../../state/quickConnect/quickConnectRequestText'
import {useQuickConnectStatus} from '../../../../../state/quickConnect/useQuickConnectStatus'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function formatCountdown(secondsLeft: number): string {
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function QuickConnectSection(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {cooldown, suggestClassicOffer} = useQuickConnectStatus()

  const openQuickConnect = (iWant: OfferType) => () => {
    navigation.navigate('QuickConnect', {iWant})
  }

  return (
    <YStack
      marginHorizontal="$5"
      marginBottom="$7"
      padding="$4"
      gap="$4"
      borderRadius="$5"
      backgroundColor="$greenBackground"
    >
      <YStack gap="$2">
        <Typography variant="tabSmallBold" color="$foregroundPrimary">
          {t('quickConnect.title')}
        </Typography>
        {Option.match(cooldown, {
          onNone: () => (
            <Typography variant="description" color="$foregroundSecondary">
              {t('quickConnect.description')}
            </Typography>
          ),
          onSome: ({secondsLeft, lastTargetCommonFriendsCount}) => (
            <Typography variant="description" color="$foregroundSecondary">
              {`${quickConnectAskedText({
                commonFriendsCount: lastTargetCommonFriendsCount,
                t,
              })} ${t('quickConnect.status.nextIn', {
                time: formatCountdown(secondsLeft),
              })}`}
            </Typography>
          ),
        })}
        {!!suggestClassicOffer && (
          <Typography variant="description" color="$foregroundSecondary">
            {t('quickConnect.status.noReply')}
          </Typography>
        )}
      </YStack>
      {Option.isNone(cooldown) && (
        <XStack gap="$3">
          <Button
            f={1}
            size="medium"
            variant="secondary"
            onPress={openQuickConnect('BUY')}
          >
            {t('offerForm.buyBitcoin')}
          </Button>
          <Button
            f={1}
            size="medium"
            variant="secondary"
            onPress={openQuickConnect('SELL')}
          >
            {t('offerForm.sellBitcoin')}
          </Button>
        </XStack>
      )}
      {!!suggestClassicOffer && (
        <Button
          size="medium"
          variant="primary"
          onPress={() => {
            navigation.navigate('CRUDOfferFlow')
          }}
        >
          {t('common.createOffer')}
        </Button>
      )}
    </YStack>
  )
}

export default QuickConnectSection
