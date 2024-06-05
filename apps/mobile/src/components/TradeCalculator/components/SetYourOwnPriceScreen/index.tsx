import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {ScrollView} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import IconButton from '../../../IconButton'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../PageWithNavigationHeader'
import Screen from '../../../Screen'
import ScreenTitle from '../../../ScreenTitle'
import closeSvg from '../../../images/closeSvg'
import {tradeCalculatorMolecule} from '../../atoms'
import BtcOwnPriceInput from './components/BtcOwnPriceInput'
import FiatOwnPriceInput from './components/FiatOwnPriceInput'
import PriceInfo from './components/PriceInfo'

function SetYourOwnPriceScreen(): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  const {ownPriceSaveButtonDisabledAtom, saveYourPriceActionAtom} = useMolecule(
    tradeCalculatorMolecule
  )

  const ownPriceSaveButtonDisabled = useAtomValue(
    ownPriceSaveButtonDisabledAtom
  )
  const saveYourPrice = useSetAtom(saveYourPriceActionAtom)

  return (
    <Screen customHorizontalPadding={getTokens().space[2].val}>
      <ScreenTitle text={t('tradeChecklist.calculateAmount.setYourOwnPrice')}>
        <IconButton icon={closeSvg} onPress={safeGoBack} />
      </ScreenTitle>
      <HeaderProxy
        onClose={safeGoBack}
        title={t('tradeChecklist.calculateAmount.setYourOwnPrice')}
      />
      <Stack f={1} bc="$black" pb="$1">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Stack space="$4">
            <Stack space="$2">
              <BtcOwnPriceInput />
              <FiatOwnPriceInput />
            </Stack>
            <PriceInfo />
          </Stack>
        </ScrollView>
      </Stack>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        disabled={ownPriceSaveButtonDisabled}
        onPress={() => {
          void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
            saveYourPrice()
            safeGoBack()
          })
        }}
        text={t('common.save')}
      />
    </Screen>
  )
}

export default SetYourOwnPriceScreen
