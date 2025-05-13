import {MoneyTextInput} from '@alexzunik/react-native-money-input'
import {useAtom} from 'jotai'
import {useEffect} from 'react'
import {getTokens, Stack, Text, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {donationAmountAtom} from '../atoms'

function DonationAmount(): JSX.Element {
  const {t} = useTranslation()
  const [donationAmount, setDonationAmount] = useAtom(donationAmountAtom)

  useEffect(() => {
    setDonationAmount(undefined)
  }, [setDonationAmount])

  return (
    <YStack>
      <Stack gap="$6">
        <Stack gap="$2">
          <Text
            fontFamily="$heading"
            fontSize={24}
            color="$black"
            textAlign="left"
          >
            {t('donationPrompt.amount')}
          </Text>
          <Text fontSize={18} color="$greyOnWhite" textAlign="left">
            {t('donationPrompt.pleaseEnterTheAmountYouWantToDonate')}
          </Text>
        </Stack>
        <Stack ai="center" gap="$2">
          <Text col="$greyAccent2">EUR</Text>
          <MoneyTextInput
            autoFocus
            value={donationAmount}
            onChangeText={(formatted, extracted) => {
              setDonationAmount(extracted)
            }}
            selectionColor={getTokens().color.black.val}
            cursorColor={getTokens().color.black.val}
            suffix="€"
            placeholder="0.00€"
            style={{
              fontSize: 48,
              color: getTokens().color.black.val,
            }}
          />
        </Stack>
      </Stack>
    </YStack>
  )
}

export default DonationAmount
