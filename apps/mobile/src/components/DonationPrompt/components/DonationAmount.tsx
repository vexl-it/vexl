import {MoneyTextInput} from '@alexzunik/react-native-money-input'
import {useAtom, useSetAtom} from 'jotai'
import {useEffect, useMemo, useRef} from 'react'
import {type TextInput} from 'react-native'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'
import SelectableCell, {
  type SelectableCellContentProps,
} from '../../SelectableCell'
import {
  donationAmountAtom,
  donationPaymentMethodAtom,
  MAX_DONATION_AMOUNT,
  PREDEFINED_DONATION_AMOUNTS,
  resetDonationPromptValuesActionAtom,
  selectedPredefinedDonationValueAtom,
} from '../atoms/stateAtoms'
import DonationPriceInSats from './DonationPriceInSats'
import PredefinedDonationValue from './PredefinedDonationValue'

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
  const moneyInputRef = useRef<TextInput>(null)
  const paymentMethods = usePaymentMethodsContent()
  const [selectedPredefinedDonationValue, setSelectedPredefinedDonationValue] =
    useAtom(selectedPredefinedDonationValueAtom)
  const [donationAmount, setDonationAmount] = useAtom(donationAmountAtom)
  const [donationPaymentMethod, setDonationPaymentMethod] = useAtom(
    donationPaymentMethodAtom
  )
  const resetDonationPromptValues = useSetAtom(
    resetDonationPromptValuesActionAtom
  )
  const maxAmount = useSetAtom(localizedDecimalNumberActionAtom)({
    number: MAX_DONATION_AMOUNT,
  })

  useEffect(() => {
    resetDonationPromptValues()
  }, [resetDonationPromptValues])

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
            )} ${t('donationPrompt.maximumAmount', {maxAmount})}`}
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
              />
            ))}
          </XStack>
          <Stack gap="$4">
            <Text fontSize={18} color="$greyOnWhite" textAlign="left">
              {t('donationPrompt.howMuchWouldYouLikeToDonate')}
            </Text>
            <XStack ai="center" jc="space-around">
              {PREDEFINED_DONATION_AMOUNTS.map((amount) => (
                <PredefinedDonationValue
                  key={amount}
                  selected={selectedPredefinedDonationValue === amount}
                  onPress={() => {
                    setSelectedPredefinedDonationValue(amount)
                    setDonationAmount(undefined)
                    moneyInputRef.current?.blur()
                  }}
                  title={`${amount}€`}
                />
              ))}
            </XStack>
          </Stack>
          <Stack gap="$4">
            <Text fontSize={18} color="$greyOnWhite" textAlign="left">
              {t('donationPrompt.orEnterCustomAmount')}
            </Text>
            <Stack ai="center" jc="center" gap="$1">
              <Text col="$greyAccent2">EUR</Text>
              <MoneyTextInput
                ref={moneyInputRef}
                value={donationAmount}
                onChangeText={(formatted, extracted) => {
                  setDonationAmount(extracted)
                  setSelectedPredefinedDonationValue(undefined)
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
            <DonationPriceInSats />
          </Stack>
        </Stack>
      </Stack>
    </YStack>
  )
}

export default DonationAmount
