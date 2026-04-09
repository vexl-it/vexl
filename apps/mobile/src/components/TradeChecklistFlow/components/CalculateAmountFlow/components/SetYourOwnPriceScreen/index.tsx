import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {
  ownPriceSaveButtonDisabledAtom,
  saveYourPriceActionAtom,
} from '../../../../../TradeCalculator/atoms'
import SetYourOwnPrice from '../../../../../TradeCalculator/components/SetYourOwnPrice'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'

function SetYourOwnPriceScreen(): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  const ownPriceSaveButtonDisabled = useAtomValue(
    ownPriceSaveButtonDisabledAtom
  )
  const saveYourPrice = useSetAtom(saveYourPriceActionAtom)

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.calculateAmount.setYourOwnPrice'),
      }}
      bottomButton={{
        disabled: ownPriceSaveButtonDisabled,
        onPress: () => {
          void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
            saveYourPrice()
            goBack()
          })
        },
        text: t('common.save'),
        variant: 'secondary',
      }}
    >
      <SetYourOwnPrice />
    </TradeChecklistItemPageLayout>
  )
}

export default SetYourOwnPriceScreen
