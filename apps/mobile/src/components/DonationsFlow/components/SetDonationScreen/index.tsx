import {
  Button,
  InfoCircle,
  Input,
  NavigationBar,
  RadioGroup,
  RowRadiobutton,
  Screen,
  Stack,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, Effect, pipe} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {getTokens} from 'tamagui'
import {type DonationsFlowScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../../utils/localization/localizedNumbersAtoms'
import {
  createDonationInvoiceActionAtom,
  paymentMethodAndAmountConfirmButtonDisabledAtom,
} from '../../../DonationPrompt/atoms'
import {
  donationAmountAtom,
  donationPaymentMethodAtom,
  MAX_DONATION_AMOUNT,
  PREDEFINED_DONATION_AMOUNTS,
  resetDonationPromptValuesActionAtom,
  selectedPredefinedDonationValueAtom,
  type DonationPaymentMethod,
} from '../../../DonationPrompt/atoms/stateAtoms'
import DonationPriceInSats from '../../../DonationPrompt/components/DonationPriceInSats'

type Props = DonationsFlowScreenProps<'SetDonation'>

const allowedPaymentMethods: readonly DonationPaymentMethod[] = [
  'BTC-LN',
  'BTC-CHAIN',
]

function SetDonationScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const tokens = getTokens()
  const [donationAmount, setDonationAmount] = useAtom(donationAmountAtom)
  const [donationPaymentMethod, setDonationPaymentMethod] = useAtom(
    donationPaymentMethodAtom
  )
  const [selectedPredefinedDonationValue, setSelectedPredefinedDonationValue] =
    useAtom(selectedPredefinedDonationValueAtom)
  const resetDonationPromptValues = useSetAtom(
    resetDonationPromptValuesActionAtom
  )
  const confirmButtonDisabled = useAtomValue(
    paymentMethodAndAmountConfirmButtonDisabledAtom
  )
  const createDonationInvoice = useSetAtom(createDonationInvoiceActionAtom)
  const localizedMaxAmount = useSetAtom(localizedDecimalNumberActionAtom)({
    number: MAX_DONATION_AMOUNT,
  })
  const amountInputWidth = donationAmount
    ? Math.max(tokens.size.$7.val, donationAmount.length * tokens.size.$5.val)
    : tokens.size.$11.val

  useEffect(() => {
    resetDonationPromptValues()
  }, [resetDonationPromptValues])

  const handleConfirm = (): void => {
    Effect.runFork(
      Effect.gen(function* (_) {
        const invoiceId = yield* _(createDonationInvoice())

        if (invoiceId) {
          yield* _(
            Effect.sync(() => {
              navigation.replace('DonationDetails', {invoiceId})
            })
          )
        }
      })
    )
  }

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('donations.setDonation.title')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: () => {
                navigation.goBack()
              },
            },
          ]}
        />
      }
      footer={
        <Button
          width="100%"
          disabled={confirmButtonDisabled}
          onPress={handleConfirm}
        >
          {t('common.confirm')}
        </Button>
      }
    >
      <YStack gap="$5" paddingBottom="$13">
        <YStack gap="$3">
          <Typography variant="paragraphSmall" color="$foregroundPrimary">
            {t('donations.setDonation.choosePaymentMethod')}
          </Typography>
          <RadioGroup
            allowedValues={allowedPaymentMethods}
            value={donationPaymentMethod}
            onValueChange={setDonationPaymentMethod}
            gap="$3"
          >
            <RowRadiobutton
              value="BTC-LN"
              label={t('offerForm.network.lightning')}
            />
            <RowRadiobutton
              value="BTC-CHAIN"
              label={t('offerForm.network.onChainRedesign')}
            />
          </RadioGroup>
        </YStack>
        <YStack gap="$3">
          <Typography variant="paragraphSmall" color="$foregroundPrimary">
            {t('donations.setDonation.amountPrompt', {
              maxAmount: localizedMaxAmount,
            })}
          </Typography>
          <YStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$3"
            minHeight="$13"
            alignItems="center"
            justifyContent="center"
            paddingHorizontal="$5"
            paddingVertical="$4"
            gap="$3"
          >
            <Typography variant="micro" color="$foregroundPrimary">
              {t('donations.setDonation.customAmount')}
            </Typography>
            <XStack alignItems="center" justifyContent="center" gap="$1">
              <Input
                unstyled
                width={amountInputWidth}
                value={donationAmount ?? ''}
                placeholder="0 €"
                keyboardType="decimal-pad"
                textAlign="center"
                fontFamily="$body"
                fontSize="$6"
                fontWeight="600"
                color="$foregroundPrimary"
                placeholderTextColor={theme.foregroundTertiary.get()}
                paddingHorizontal="$0"
                selectTextOnFocus
                selectionColor={theme.accentHighlightSecondary.get()}
                onChangeText={(text) => {
                  const normalizedAmount = text
                    .replace(',', '.')
                    .replace(/[^0-9.]/g, '')
                    .replace(/^0+(?=\d)/, '')

                  setDonationAmount(
                    normalizedAmount.length > 0 ? normalizedAmount : undefined
                  )
                  setSelectedPredefinedDonationValue(undefined)
                }}
              />
              {donationAmount ? (
                <Typography variant="titles" color="$foregroundPrimary">
                  €
                </Typography>
              ) : null}
            </XStack>
          </YStack>
          <XStack flexWrap="wrap" gap="$5">
            {pipe(
              PREDEFINED_DONATION_AMOUNTS,
              Array.map((amount) => (
                <Stack
                  key={amount}
                  flexBasis="45%"
                  flexGrow={1}
                  height="$10"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor={
                    selectedPredefinedDonationValue === amount
                      ? '$accentYellowSecondary'
                      : '$backgroundSecondary'
                  }
                  borderRadius="$3"
                  pressStyle={{opacity: 0.7}}
                  onPress={() => {
                    setSelectedPredefinedDonationValue(amount)
                    setDonationAmount(undefined)
                  }}
                >
                  <Typography
                    variant="paragraph"
                    color={
                      selectedPredefinedDonationValue === amount
                        ? '$accentHighlightPrimary'
                        : '$foregroundPrimary'
                    }
                  >
                    {`${amount} €`}
                  </Typography>
                </Stack>
              ))
            )}
          </XStack>
        </YStack>
        <XStack
          backgroundColor="$backgroundSecondary"
          borderRadius="$3"
          padding="$5"
          gap="$2"
          alignItems="center"
        >
          <InfoCircle size={18} color={theme.foregroundSecondary.get()} />
          <DonationPriceInSats />
        </XStack>
      </YStack>
    </Screen>
  )
}

export default SetDonationScreen
