import {ChevronLeft, NavigationBar, QrCode, Screen, YStack} from '@vexl-next/ui'
import React from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {AccountReachStats} from './components/AccountReachStats'
import {ActionSteps} from './components/ActionSteps'
import {Menus} from './components/Menus'
import UserBanner from './components/UserBanner'
import VersionInfo from './components/VersionInfo'

type Props = RootStackScreenProps<'Account'>

function AccountScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('account.title')}
          leftAction={{
            icon: ChevronLeft,
            onPress: safeGoBack,
          }}
          rightActions={[
            {
              icon: QrCode,
              onPress: () => {
                navigation.navigate('ScanQrCode')
              },
            },
          ]}
        />
      }
    >
      <YStack gap="$7">
        <UserBanner />
        <ActionSteps />
        <AccountReachStats />
        {/*<AccountStats />*/}
        <Menus />
        <VersionInfo />
      </YStack>
    </Screen>
  )
}

export default AccountScreen
