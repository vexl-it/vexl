import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {useAtom} from 'jotai'
import {changeCurrencyDialogVisibleAtom} from '../../atoms'
import SettingsScreenDialog from '../SettingsScreenDialog'
import {Text, XStack, YStack} from 'tamagui'
import RadioButton from '../../../../../RadioButton'
import {type Currency} from '@vexl-next/domain/src/general/offers'
import useContent from './useContent'
import {selectedCurrencyAtom} from '../../../../../../state/selectedCurrency'
import {useState} from 'react'

interface CurrencyItemProps {
  active: boolean
  currency: Currency
  onButtonPress: (_: Currency) => void
  title: string
}

function CurrencyItem({
  active,
  currency,
  onButtonPress,
  title,
}: CurrencyItemProps): JSX.Element {
  return (
    <XStack
      ai={'center'}
      space={'$2'}
      onPress={() => {
        onButtonPress(currency)
      }}
    >
      <RadioButton
        active={active}
        onPress={() => {
          onButtonPress(currency)
        }}
      />
      <Text col={active ? '$black' : '$greyOnWhite'} fos={18} ff={'$body500'}>
        {title}
      </Text>
    </XStack>
  )
}

function ChangeCurrency(): JSX.Element {
  const {t} = useTranslation()
  const content = useContent()
  const [storedSelectedCurrency, storeSelectedCurrency] =
    useAtom(selectedCurrencyAtom)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    storedSelectedCurrency
  )

  const [changeCurrencyDialogVisible, setChangeCurrencyDialogVisible] = useAtom(
    changeCurrencyDialogVisibleAtom
  )

  return (
    <SettingsScreenDialog
      secondaryButton={{
        text: t('common.done'),
        onPress: () => {
          storeSelectedCurrency(selectedCurrency)
          return true
        },
      }}
      onClose={() => {
        setChangeCurrencyDialogVisible(false)
      }}
      title={t('common.currency')}
      visible={changeCurrencyDialogVisible}
    >
      <YStack space={'$6'}>
        {content.map((item) => (
          <CurrencyItem
            key={item.currency}
            active={selectedCurrency === item.currency}
            currency={item.currency}
            onButtonPress={(currency) => {
              setSelectedCurrency(currency)
            }}
            title={item.title}
          />
        ))}
      </YStack>
    </SettingsScreenDialog>
  )
}

export default ChangeCurrency
