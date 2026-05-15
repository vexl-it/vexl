import {
  Button,
  FaqStayAnonymous,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {type RootStackScreenProps} from '../navigationTypes'
import {useTranslation} from '../utils/localization/I18nProvider'

type Props = RootStackScreenProps<'WhatAreClubs'>

function WhatAreClubsScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: navigation.goBack,
            },
          ]}
        />
      }
    >
      <YStack gap="$5" f={1}>
        <YStack
          f={1}
          borderRadius="$5"
          backgroundColor="$backgroundTertiary"
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$8"
          p="$5"
        >
          <YStack f={1} justifyContent="center">
            <FaqStayAnonymous animate />
          </YStack>
          <YStack gap="$4">
            <Typography
              variant="heading3"
              fontWeight={700}
              color="$foregroundPrimary"
            >
              {t('suggestion.whatAreClubs2')}
            </Typography>
            <Typography variant="paragraphSmall" color="$foregroundSecondary">
              {t('suggestion.whatAreClubs2Text')}
            </Typography>
          </YStack>
        </YStack>
        <XStack width="100%" alignItems="stretch" gap="$4">
          <Button
            f={1}
            variant="secondary"
            onPress={() => {
              navigation.goBack()
            }}
          >
            {t('common.gotIt')}
          </Button>
          <Button
            f={1}
            variant="primary"
            onPress={() => {
              navigation.navigate('JoinClubFlow', {
                screen: 'ScanClubQrCodeScreen',
              })
            }}
          >
            {t('clubs.joinNewClub')}
          </Button>
        </XStack>
      </YStack>
    </Screen>
  )
}

export default WhatAreClubsScreen
