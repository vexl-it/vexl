import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {loadingOverlayDisplayedAtom} from '../../../../../../LoadingOverlayProvider'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../../../PageWithNavigationHeader'
import TradeCalculator from '../../../../../../TradeCalculator'
import {tradeCalculatorMolecule} from '../../../../../../TradeCalculator/atoms'
import {submitTradeChecklistUpdatesActionAtom} from '../../../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../../../utils'
import Content from '../../../../Content'
import {
  isOtherSideAmountDataNewerThanMineAtom,
  saveButtonDisabledAtom,
  saveLocalCalculatedAmountDataStateToMainStateActionAtom,
} from '../../../atoms'

type Props = TradeChecklistStackScreenProps<'CalculateAmount'>

function CalculateAmount({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const {tradeCalculatorStateAtom} = useMolecule(tradeCalculatorMolecule)

  const isOtherSideAmountDataNewerThanMine = useAtomValue(
    isOtherSideAmountDataNewerThanMineAtom
  )
  const saveButtonDisabled = useAtomValue(saveButtonDisabledAtom)
  const store = useStore()
  const shouldNavigateBackToChatOnSave =
    !useWasOpenFromAgreeOnTradeDetailsScreen()
  const saveLocalCalculatedAmountDataStateToMainState = useSetAtom(
    saveLocalCalculatedAmountDataStateToMainStateActionAtom
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )

  const onFooterButtonPress = useCallback(() => {
    void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
      void saveLocalCalculatedAmountDataStateToMainState(
        tradeCalculatorStateAtom
      )().then((success) => {
        if (success) {
          if (shouldNavigateBackToChatOnSave) {
            showLoadingOverlay(true)
            void submitTradeChecklistUpdates()().finally(() => {
              showLoadingOverlay(false)
            })
            navigation.navigate('ChatDetail', store.get(chatWithMessagesKeys))
          } else {
            navigation.navigate('AgreeOnTradeDetails')
          }
        }
      })
    })
  }, [
    saveLocalCalculatedAmountDataStateToMainState,
    tradeCalculatorStateAtom,
    shouldNavigateBackToChatOnSave,
    showLoadingOverlay,
    submitTradeChecklistUpdates,
    navigation,
    store,
  ])

  return (
    <>
      <HeaderProxy
        onClose={navigation.goBack}
        title={t('tradeChecklist.calculateAmount.calculateAmount')}
      />
      <Content scrollable>
        <TradeCalculator />
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        disabled={saveButtonDisabled}
        onPress={onFooterButtonPress}
        text={
          isOtherSideAmountDataNewerThanMine
            ? t('common.accept')
            : t('common.save')
        }
      />
    </>
  )
}

export default CalculateAmount
