import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {getTokens} from 'tamagui'
import {fetchMyDonationsActionAtom} from '../../state/donations/atom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import {showDonationPromptActionAtom} from '../DonationPrompt/atoms'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import DonationsList from './components/DonationsList'

function MyDonationsScreen(): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const showDonationsPrompt = useSetAtom(showDonationPromptActionAtom)
  const fetchMyDonations = useSetAtom(fetchMyDonationsActionAtom)

  useEffect(() => {
    Effect.runFork(fetchMyDonations())
  }, [fetchMyDonations])

  return (
    <Screen customHorizontalPadding={getTokens().space[2].val}>
      <KeyboardAvoidingView>
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
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default MyDonationsScreen
