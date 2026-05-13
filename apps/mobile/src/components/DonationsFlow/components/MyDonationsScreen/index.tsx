import {ChevronLeft, NavigationBar, Screen} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {type DonationsFlowScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import {updateAllNonSettledOrExpiredInvoicesStatusTypesActionAtom} from '../../../DonationPrompt/atoms'
import DonationsList from './components/DonationsList'

type Props = DonationsFlowScreenProps<'MyDonations'>

function MyDonationsScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const updateAllNonSettledOrExpiredInvoicesStatusTypes = useSetAtom(
    updateAllNonSettledOrExpiredInvoicesStatusTypesActionAtom
  )

  useEffect(() => {
    Effect.runFork(updateAllNonSettledOrExpiredInvoicesStatusTypes())
  }, [updateAllNonSettledOrExpiredInvoicesStatusTypes])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('donations.myDonations')}
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        />
      }
    >
      <DonationsList
        onDonatePress={() => {
          navigation.navigate('SetDonation')
        }}
      />
    </Screen>
  )
}

export default MyDonationsScreen
