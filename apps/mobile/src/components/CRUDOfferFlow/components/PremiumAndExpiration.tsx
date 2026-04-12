import {useNavigation} from '@react-navigation/native'
import {BuySellRangeSlider, RowButton, Typography} from '@vexl-next/ui'
import {Calendar, ChevronDown, ChevronUp} from '@vexl-next/ui/src/icons'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useCallback, useMemo, useState} from 'react'
import {getTokens, useTheme, XStack, YStack} from 'tamagui'
import {currencies} from '../../../utils/localization/currency'
import {
  type TFunction,
  getCurrentLocale,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import AnimatedCollapse from '../../FilterOffersScreen/components/AnimatedCollapse'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

const SLIDER_THRESHOLD = 10

function getInfoText(feeAmount: number, isBuy: boolean, t: TFunction): string {
  const halfThreshold = SLIDER_THRESHOLD / 2

  if (isBuy) {
    if (feeAmount === 0)
      return t('offerForm.premiumOrDiscount.youBuyForTheActualMarketPrice')
    if (feeAmount > 0) {
      if (feeAmount <= halfThreshold)
        return t('offerForm.premiumOrDiscount.theOptimalPositionForMostPeople')
      return t('offerForm.premiumOrDiscount.youBuyReallyFast')
    }
    if (Math.abs(feeAmount) <= halfThreshold)
      return t('offerForm.premiumOrDiscount.youBuyPrettyCheap')
    return t('offerForm.premiumOrDiscount.youBuyVeryCheaply')
  }

  if (feeAmount === 0)
    return t('offerForm.premiumOrDiscount.slider.sellingAtMarketPrice')
  if (feeAmount > 0) {
    if (feeAmount <= halfThreshold)
      return t('offerForm.premiumOrDiscount.slider.earnBitMore')
    return t('offerForm.premiumOrDiscount.slider.earnMuchMore')
  }
  if (Math.abs(feeAmount) <= halfThreshold)
    return t('offerForm.premiumOrDiscount.slider.sellSlightlyFaster')
  return t('offerForm.premiumOrDiscount.slider.sellMuchFaster')
}

interface PremiumAndExpirationProps {
  readonly amountMin: number
  readonly amountMax: number
  readonly showPremium?: boolean
}

function PremiumAndExpiration({
  amountMin,
  amountMax,
  showPremium = true,
}: PremiumAndExpirationProps): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const locale = getCurrentLocale()
  const navigation = useNavigation()
  const {
    currencyAtom,
    feeAmountAtom,
    feeStateAtom,
    offerTypeOrDummyValueAtom,
    expirationDateAtom,
  } = useMolecule(offerFormMolecule)

  const currency = useAtomValue(currencyAtom)
  const [feeAmount, setFeeAmount] = useAtom(feeAmountAtom)
  const setFeeState = useSetAtom(feeStateAtom)
  const offerType = useAtomValue(offerTypeOrDummyValueAtom)
  const expirationDate = useAtomValue(expirationDateAtom)

  const [expanded, setExpanded] = useState(false)

  const isBuy = offerType === 'BUY'

  const handlePercentageChange = useCallback(
    (value: number) => {
      setFeeAmount(value)
      setFeeState(value !== 0 ? 'WITH_FEE' : 'WITHOUT_FEE')
    },
    [setFeeAmount, setFeeState]
  )

  const handleExpirationPress = useCallback(() => {
    navigation.navigate('OfferExpirationDate')
  }, [navigation])

  const changedOptionsCount =
    (showPremium && feeAmount !== 0 ? 1 : 0) + (expirationDate ? 1 : 0)

  const priceTagText =
    feeAmount === 0
      ? t('offerForm.premiumOrDiscount.marketPrice')
      : `${feeAmount > 0 ? '+' : ''}${feeAmount} %`

  const infoText = getInfoText(feeAmount, isBuy, t)

  const amountText = useMemo(() => {
    if (!currency) return ''
    const multiplier = 1 + feeAmount / 100
    const adjustedMin = Math.round(amountMin * multiplier)
    const adjustedMax = Math.round(amountMax * multiplier)
    const currencyCode = currencies[currency].code
    const formatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    })
    const range = `${formatter.format(adjustedMin)} – ${formatter.format(adjustedMax)} ${currencyCode}`
    return isBuy
      ? t('offerForm.premiumOrDiscount.youllPayAround', {amount: range})
      : t('offerForm.premiumOrDiscount.youllGetAround', {amount: range})
  }, [amountMin, amountMax, feeAmount, currency, locale, isBuy, t])

  return (
    <>
      <XStack
        alignItems="center"
        justifyContent="center"
        gap="$3"
        paddingVertical="$6"
        onPress={() => {
          setExpanded((prev) => !prev)
        }}
      >
        <XStack alignItems="center" gap="$2">
          <Typography
            variant="descriptionBold"
            color="$accentHighlightSecondary"
          >
            {expanded
              ? t('offerForm.hideOptions')
              : t('offerForm.showMoreOptions')}
          </Typography>
          {changedOptionsCount > 0 ? (
            <XStack
              backgroundColor="$accentYellowSecondary"
              borderRadius="$8"
              minWidth={19}
              paddingHorizontal="$1"
              paddingVertical={2}
              alignItems="center"
              justifyContent="center"
            >
              <Typography
                variant="micro"
                color="$accentHighlightSecondary"
                textAlign="center"
              >
                {changedOptionsCount}
              </Typography>
            </XStack>
          ) : null}
        </XStack>
        {expanded ? (
          <ChevronUp
            color={theme.accentHighlightSecondary.val}
            size={getTokens().size.$7.val}
          />
        ) : (
          <ChevronDown
            color={theme.accentHighlightSecondary.val}
            size={getTokens().size.$7.val}
          />
        )}
      </XStack>

      {expanded ? (
        <AnimatedCollapse expanded animateOnMount>
          <YStack gap="$5">
            {showPremium ? (
              <YStack gap="$3">
                <YStack gap="$3" paddingVertical="$3">
                  <Typography
                    variant="paragraphDemibold"
                    color="$foregroundPrimary"
                  >
                    {t('offerForm.premiumOrDiscount.premiumOrDiscount')}
                  </Typography>
                  <Typography
                    variant="description"
                    color="$foregroundSecondary"
                  >
                    {isBuy
                      ? t('offerForm.premiumOrDiscount.buyDescription')
                      : t('offerForm.premiumOrDiscount.sellDescription')}
                  </Typography>
                </YStack>

                <XStack alignItems="center" justifyContent="space-between">
                  <Typography
                    variant="paragraphDemibold"
                    color="$foregroundPrimary"
                  >
                    {isBuy
                      ? t('offerForm.premiumOrDiscount.youBuyBtcFor')
                      : t('offerForm.premiumOrDiscount.youSellBtcFor')}
                  </Typography>
                  <XStack
                    backgroundColor="$backgroundSecondary"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderRadius="$3"
                  >
                    <Typography
                      variant="paragraphSmall"
                      color="$foregroundPrimary"
                    >
                      {priceTagText}
                    </Typography>
                  </XStack>
                </XStack>

                <BuySellRangeSlider
                  leftLabel={
                    isBuy
                      ? t('offerForm.premiumOrDiscount.buyCheaply')
                      : t('offerForm.premiumOrDiscount.sellFaster')
                  }
                  rightLabel={
                    isBuy
                      ? t('offerForm.premiumOrDiscount.buyFaster')
                      : t('offerForm.premiumOrDiscount.earnMore')
                  }
                  minPercentage={-SLIDER_THRESHOLD}
                  maxPercentage={SLIDER_THRESHOLD}
                  percentage={feeAmount}
                  onPercentageChange={handlePercentageChange}
                  infoText={infoText}
                  amountText={amountText}
                />
              </YStack>
            ) : null}

            <YStack gap="$3">
              <Typography
                variant="paragraphDemibold"
                color="$foregroundPrimary"
              >
                {t('offerForm.expiration.expirationDate')}
              </Typography>
              <RowButton
                label={
                  expirationDate
                    ? DateTime.fromISO(expirationDate).toLocaleString(
                        DateTime.DATE_FULL,
                        {locale}
                      )
                    : t('offerForm.expiration.selectDate')
                }
                icon={Calendar}
                onPress={handleExpirationPress}
              />
            </YStack>
          </YStack>
        </AnimatedCollapse>
      ) : null}
    </>
  )
}

export default PremiumAndExpiration
