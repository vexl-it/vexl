import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import {updateAllNonSettledOrExpiredInvoicesStatusTypesActionAtom} from '../DonationPrompt/atoms'
import showDonationPromptActionAtom from '../DonationPrompt/atoms/showDonationPromptActionAtom'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import DonationsList from './components/DonationsList'

function MyDonationsScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const showDonationsPrompt = useSetAtom(showDonationPromptActionAtom)
  const updateAllNonSettledOrExpiredInvoicesStatusTypes = useSetAtom(
    updateAllNonSettledOrExpiredInvoicesStatusTypesActionAtom
  )

  useEffect(() => {
    Effect.runFork(updateAllNonSettledOrExpiredInvoicesStatusTypes())
  }, [updateAllNonSettledOrExpiredInvoicesStatusTypes])

  return (
    <Screen customHorizontalPadding={getTokens().space[2].val}>
      <ScreenTitle
        allowMultipleLines
        mb="$5"
        text={t('donations.myDonations')}
        mx="$4"
        withBottomBorder
      >
        <IconButton
          iconStroke="white"
          variant="dark"
          icon={closeSvg}
          onPress={safeGoBack}
        />
      </ScreenTitle>
      <DonationsList />
      <Button
        onPress={() => {
          Effect.runFork(showDonationsPrompt())
        }}
        variant="secondary"
        text={t('donationPrompt.donate')}
      />
    </Screen>
  )
}

export default MyDonationsScreen
