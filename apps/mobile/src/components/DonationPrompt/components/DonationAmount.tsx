import {MoneyTextInput} from '@alexzunik/react-native-money-input'
import {useAtom} from 'jotai'
import {useEffect, useMemo} from 'react'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import SelectableCell, {
  type SelectableCellContentProps,
} from '../../SelectableCell'
import {
  donationAmountAtom,
  donationPaymentMethodAtom,
  MAX_DONATION_AMOUNT,
} from '../atoms/stateAtoms'

function usePaymentMethodsContent(): Array<
  SelectableCellContentProps<'BTC-CHAIN' | 'BTC-LN'>
> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('offerForm.network.lightning'),
        type: 'BTC-LN',
      },
      {
        title: t('offerForm.network.onChain'),
        type: 'BTC-CHAIN',
      },
    ],
    [t]
  )
}

function DonationAmount(): JSX.Element {
  const {t} = useTranslation()
  const paymentMethods = usePaymentMethodsContent()
  const [donationAmount, setDonationAmount] = useAtom(donationAmountAtom)
  const [donationPaymentMethod, setDonationPaymentMethod] = useAtom(
    donationPaymentMethodAtom
  )

  useEffect(() => {
    setDonationAmount(undefined)
    setDonationPaymentMethod('BTC-LN')
  }, [setDonationAmount, setDonationPaymentMethod])

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
            {t('donationPrompt.paymentMethodAndAmount')}
          </Text>
          <Text fontSize={18} color="$greyOnWhite" textAlign="left">
            {`${t(
              'donationPrompt.pleaseSelectThePaymentMethodAndAmountYouWantToDonate'
            )} ${t('donationPrompt.maximumAmount', {maxAmount: MAX_DONATION_AMOUNT})}`}
          </Text>
        </Stack>
        <Stack gap="$6">
          <XStack ai="center" jc="space-around">
            {paymentMethods.map((paymentMethod) => (
              <SelectableCell
                key={paymentMethod.type}
                selected={donationPaymentMethod === paymentMethod.type}
                onPress={setDonationPaymentMethod}
                title={paymentMethod.title}
                type={paymentMethod.type}
                variant="light"
              />
            ))}
          </XStack>
          <Stack ai="center" jc="center" gap="$1">
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
              placeholder="0€"
              style={{
                fontSize: 48,
                color: getTokens().color.black.val,
              }}
            />
          </Stack>
        </Stack>
      </Stack>
    </YStack>
  )
}

export default DonationAmount
