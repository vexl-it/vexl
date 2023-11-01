import ScreenWrapper from '../ScreenWrapper'
import OnlineOrInPersonTrade from './components/OnlineOrInPersonTrade'
import {useAtomValue, useSetAtom} from 'jotai'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import {
  offerForTradeChecklistAtom,
  submitChangesAndSendMessageActionAtom,
} from '../../atoms'

function AgreeOnTradeDetailsScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const offerForTradeChecklist = useAtomValue(offerForTradeChecklistAtom)
  const submitChangesAndSendMessage = useSetAtom(
    submitChangesAndSendMessageActionAtom
  )

  return (
    <ScreenWrapper
      showAnonymizationNotice
      scrollable
      buttonTitle={
        offerForTradeChecklist?.offerInfo.publicPart.locationState === 'ONLINE'
          ? t('tradeChecklist.acknowledgeAndContinue')
          : t('tradeChecklist.saveAndContinue')
      }
      onButtonPress={() => {
        void submitChangesAndSendMessage().then((success) => {
          if (success) {
            goBack()
          }
        })
      }}
    >
      <OnlineOrInPersonTrade />
    </ScreenWrapper>
  )
}

export default AgreeOnTradeDetailsScreen
