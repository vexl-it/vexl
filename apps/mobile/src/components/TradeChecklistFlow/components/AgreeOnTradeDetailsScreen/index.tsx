import {useFocusEffect} from '@react-navigation/native'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import {FooterButtonProxy} from '../../../PageWithNavigationHeader'
import headerStateAtom from '../../../PageWithNavigationHeader/state/headerStateAtom'
import {submitTradeChecklistUpdatesActionAtom} from '../../atoms/updatesToBeSentAtom'
import Content from '../Content'
import OnlineOrInPersonTrade from './components/OnlineOrInPersonTrade'

function AgreeOnTradeDetailsScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const offerForTradeChecklist = useAtomValue(fromChatAtoms.originOfferAtom)
  const submitChangesAndSendMessage = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const setHeaderState = useSetAtom(headerStateAtom)

  useFocusEffect(
    useCallback(() => {
      setHeaderState((prev) => ({...prev, hidden: true}))
    }, [setHeaderState])
  )

  return (
    <>
      <Content scrollable>
        <OnlineOrInPersonTrade />
      </Content>
      <FooterButtonProxy
        text={
          offerForTradeChecklist?.offerInfo.publicPart.locationState ===
          'ONLINE'
            ? t('tradeChecklist.acknowledgeAndContinue')
            : t('tradeChecklist.saveAndContinue')
        }
        onPress={() => {
          void submitChangesAndSendMessage()().then((success) => {
            if (success) {
              goBack()
            }
          })
        }}
      />
    </>
  )
}

export default AgreeOnTradeDetailsScreen
