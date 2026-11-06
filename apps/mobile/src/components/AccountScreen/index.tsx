import {ChevronLeft, NavigationBar, QrCode, Screen, YStack} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {areRealUserDataSet} from '../../state/session/userDataAtoms'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {showAccountIdentityDotAtom} from '../../utils/preferences'
import useSafeGoBack from '../../utils/useSafeGoBack'
import AddIdentityBanner from '../AddIdentityBanner'
import {AccountReachStats} from './components/AccountReachStats'
import {ActionSteps} from './components/ActionSteps'
import {Menus} from './components/Menus'
import UserBanner from './components/UserBanner'
import VersionInfo from './components/VersionInfo'

type Props = RootStackScreenProps<'Account'>

function AccountScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const realUserDataSet = useAtomValue(areRealUserDataSet)
  const setShowAccountIdentityDot = useSetAtom(showAccountIdentityDotAtom)

  useEffect(() => {
    setShowAccountIdentityDot(false)
  }, [setShowAccountIdentityDot])

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
        {!realUserDataSet && <AddIdentityBanner />}
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
