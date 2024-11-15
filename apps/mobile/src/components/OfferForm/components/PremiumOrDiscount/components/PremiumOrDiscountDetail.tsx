import {type OfferType} from '@vexl-next/domain/src/general/offers'
import {
  useAtom,
  useAtomValue,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import React, {useState} from 'react'
import {Modal} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import Input from '../../../../Input'
import KeyboardAvoidingView from '../../../../KeyboardAvoidingView'
import {SLIDER_THRESHOLD} from '../../../../PremiumOrDiscountSlider'
import Screen from '../../../../Screen'
import ScreenTitle from '../../../../ScreenTitle'

interface Props {
  feeAmountAtom: WritableAtom<number, [SetStateAction<number>], void>
  offerTypeAtom: WritableAtom<OfferType, [SetStateAction<OfferType>], void>
  onClose: () => void
  visible: boolean
}

function PremiumOrDiscountDetail({
  feeAmountAtom,
  offerTypeAtom,
  onClose,
  visible,
}: Props): JSX.Element {
  const {t} = useTranslation()

  const offerType = useAtomValue(offerTypeAtom)
  const [feeAmount, setFeeAmount] = useAtom(feeAmountAtom)
  const [inputValue, setInputValue] = useState<string>(
    feeAmount > 0 ? `+${feeAmount}` : feeAmount === 0 ? '' : `${feeAmount}`
  )

  const onContinuePress = (): void => {
    setFeeAmount(Number(inputValue))
    onClose()
  }

  const onInputValueChange = (text: string): void => {
    const onlyNumericsAndPlusMinus = /^[-+]?[0-9]*$/

    if (onlyNumericsAndPlusMinus.test(text)) {
      setInputValue(text)
    }
  }

  const checkInputValueFee = (): number =>
    inputValue.length === 0 || inputValue === '+' || inputValue === '-'
      ? 0
      : Number(inputValue)

  const onPlusPress = (): void => {
    const fee = checkInputValueFee()
    setInputValue(fee >= 0 ? `+${fee + 1}` : `${fee + 1}`)
  }
  const onMinusPress = (): void => {
    const fee = checkInputValueFee()
    setInputValue(fee <= 0 ? `${fee - 1}` : `+${fee - 1}`)
  }

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Screen customHorizontalPadding={16}>
        <KeyboardAvoidingView>
          <Stack flex={1} gap="$4">
            <ScreenTitle
              text={t('offerForm.premiumOrDiscount.premiumOrDiscount')}
              onBackButtonPress={onClose}
              withBottomBorder
              withBackButton
            />
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              mr="$4"
              fos={18}
              ff="$body600"
              col="$white"
            >
              {offerType === 'BUY'
                ? t('offerForm.premiumOrDiscount.youBuyBtcFor')
                : t('offerForm.premiumOrDiscount.youSellBtcFor')}
            </Text>
            <XStack>
              <Input
                value={inputValue}
                onChangeText={onInputValueChange}
                placeholder="+0"
                keyboardType="number-pad"
                leftText={t('offerForm.premiumOrDiscount.marketPrice')}
                rightText="%"
                variant="greyOnBlack"
                textColor={
                  Number(inputValue) === 0
                    ? '$greyOnBlack'
                    : Math.abs(Number(inputValue)) > SLIDER_THRESHOLD / 2
                      ? '$red'
                      : '$main'
                }
                style={{
                  flex: 1,
                }}
              />
            </XStack>
            <XStack>
              <Button
                text={t('offerForm.premiumOrDiscount.minus')}
                onPress={onMinusPress}
                variant="blackOnDark"
                fullSize
              />
              <Stack w="$2" />
              <Button
                text={t('offerForm.premiumOrDiscount.plus')}
                onPress={onPlusPress}
                variant="blackOnDark"
                fullSize
              />
            </XStack>
          </Stack>
          <Button
            onPress={onContinuePress}
            text={t('common.continue')}
            variant="secondary"
          />
        </KeyboardAvoidingView>
      </Screen>
    </Modal>
  )
}

export default PremiumOrDiscountDetail
